import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiscountType,
  OrderStatus,
  PaymentMethod,
  Prisma,
  Status,
  Voucher,
} from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PaypalService } from '../paypal.service';
import { EnvService } from 'src/shared/env/env.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CaptureOrderDto } from './dto/capture-order.dto';

@Injectable()
export class PaymentClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paypalService: PaypalService,
    private readonly envService: EnvService,
  ) {}

  async createOrder(dto: CreateOrderDto, currentUser: currentClientUser) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: dto.courseId,
        deletedAt: null,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        teacherId: true,
        thumbnailUrl: true,
        slug: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId === currentUser.id) {
      throw new BadRequestException('You cannot buy your own course');
    }

    let voucher: Voucher | null = null;
    if (dto.voucherCode) {
      voucher = await this.validateVoucher(dto.voucherCode, course.id);
    }

    const finalPrice = this.calculateFinalPrice(course.price, voucher);
    const discountAmount = Math.max(course.price - finalPrice, 0);

    const existingOrder = await this.prisma.order.findUnique({
      where: {
        userId_courseId: {
          userId: currentUser.id,
          courseId: course.id,
        },
      },
    });

    if (existingOrder && existingOrder.status === OrderStatus.success) {
      throw new BadRequestException('You already purchased this course');
    }

    const orderCode = `ORD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    let orderRecord;

    if (finalPrice <= 0) {
      orderRecord = await this.saveOrderRecord(existingOrder?.id, {
        Order_id: orderCode,
        userId: currentUser.id,
        courseId: course.id,
        discountAmount,
        finalPrice,
        voucherId: voucher?.id || null,
        paymentMethod: PaymentMethod.paypal,
        status: OrderStatus.success,
        paymentId: 'FREE_ORDER',
        completedAt: new Date(),
      });

      await this.incrementCounters(orderRecord, currentUser.id);

      const response: successResponse = {
        message: 'Checkout completed without payment',
        data: {
          orderId: orderRecord.id,
          orderCode: orderRecord.Order_id,
          finalPrice: orderRecord.finalPrice,
          discountAmount: orderRecord.discountAmount,
        },
      };

      return response;
    }

    const redirectBase = this.envService.get('PAYPAL_REDIRECT_BASE_URL');
    const paypalOrder = await this.paypalService.createOrder({
      amount: finalPrice,
      currency: 'USD',
      description: `Purchase course ${course.title}`,
      invoiceId: orderCode,
      returnUrl: `${redirectBase}/payment/success`,
      cancelUrl: `${redirectBase}/payment/cancel`,
    });

    const approvalUrl = paypalOrder?.links?.find(
      (link: any) => link.rel === 'approve',
    )?.href;

    if (!approvalUrl) {
      throw new BadRequestException('Unable to generate PayPal approval link');
    }

    orderRecord = await this.saveOrderRecord(existingOrder?.id, {
      Order_id: orderCode,
      userId: currentUser.id,
      courseId: course.id,
      discountAmount,
      finalPrice,
      voucherId: voucher?.id || null,
      paymentMethod: PaymentMethod.paypal,
      status: OrderStatus.processing,
      paymentId: paypalOrder.id,
      completedAt: null,
    });

    const response: successResponse = {
      message: 'Created PayPal order successfully',
      data: {
        orderId: orderRecord.id,
        orderCode: orderRecord.Order_id,
        paypalOrderId: paypalOrder.id,
        approvalUrl,
        finalPrice: orderRecord.finalPrice,
        discountAmount: orderRecord.discountAmount,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnailUrl: course.thumbnailUrl,
          price: course.price,
        },
      },
    };

    return response;
  }

  async captureOrder(
    orderId: string,
    dto: CaptureOrderDto,
    currentUser: currentClientUser,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        voucher: true,
        course: {
          select: {
            teacherId: true,
            conversationId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== currentUser.id) {
      throw new ForbiddenException('You do not own this order');
    }

    if (order.status === OrderStatus.success) {
      return {
        message: 'Order already completed',
        data: {
          orderId: order.id,
          orderCode: order.Order_id,
        },
      };
    }

    if (order.paymentMethod !== PaymentMethod.paypal) {
      throw new BadRequestException('Unsupported payment method for capture');
    }

    if (!order.paymentId) {
      throw new BadRequestException('Missing PayPal order id');
    }

    if (order.paymentId !== dto.paypalOrderId) {
      throw new BadRequestException('PayPal order id mismatch');
    }

    const capture = await this.paypalService.captureOrder(dto.paypalOrderId);

    if (capture.status !== 'COMPLETED') {
      throw new BadRequestException('Payment has not been completed');
    }

    const captureId =
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      dto.paypalOrderId;

    // Get admin settings for commission percentage
    const adminSettings = await this.prisma.adminSetting.findFirst();
    const commissionRate = adminSettings?.percentCommission || 0;

    // Calculate commission and teacher's net amount
    const commissionAmount =
      Math.round(order.finalPrice * (commissionRate / 100) * 100) / 100;
    const teacherNetAmount =
      Math.round((order.finalPrice - commissionAmount) * 100) / 100;

    await this.prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.success,
          completedAt: new Date(),
          paymentId: captureId,
        },
      });

      // Get or create platform wallet
      let platformWallet = await tx.platformWallet.findFirst();
      if (!platformWallet) {
        platformWallet = await tx.platformWallet.create({
          data: {
            revenue: 0,
          },
        });
      }

      // Create platform transaction for commission (only if commission > 0)
      if (commissionAmount > 0) {
        await tx.platformTransaction.create({
          data: {
            walletId: platformWallet.id,
            type: 'commission_income',
            amount: commissionAmount,
            balanceBefore: platformWallet.revenue,
            balanceAfter: platformWallet.revenue + commissionAmount,
            description: `Commission from course purchase: ${order.Order_id}`,
            userId: order.userId,
            metadata: {
              orderId: order.id,
              orderCode: order.Order_id,
              courseId: order.courseId,
              finalPrice: order.finalPrice,
              commissionRate: commissionRate,
              commissionAmount: commissionAmount,
              teacherNetAmount: teacherNetAmount,
            },
          },
        });

        // Update platform wallet revenue
        await tx.platformWallet.update({
          where: { id: platformWallet.id },
          data: {
            revenue: { increment: commissionAmount },
          },
        });
      }

      // Get teacher's wallet to record balance before transaction
      const teacherWallet = await tx.wallet.findUnique({
        where: { userId: order.course.teacherId },
      });

      if (!teacherWallet) {
        throw new Error('Teacher wallet not found');
      }

      // Create transaction record for teacher receiving payment from order
      if (teacherNetAmount > 0) {
        await tx.transaction.create({
          data: {
            walletId: teacherWallet.id,
            type: 'order',
            amount: teacherNetAmount,
            balanceBefore: teacherWallet.balance,
            balanceAfter: teacherWallet.balance + teacherNetAmount,
            status: 'completed',
            description: `Payment received from course purchase: ${order.Order_id}`,
            referenceId: order.id,
            metadata: {
              orderId: order.id,
              orderCode: order.Order_id,
              courseId: order.courseId,
              finalPrice: order.finalPrice,
              commissionRate: commissionRate,
              commissionAmount: commissionAmount,
              netAmount: teacherNetAmount,
            },
          },
        });
      }

      // Update teacher's wallet with net amount (after commission)
      await tx.wallet.update({
        where: { userId: order.course.teacherId },
        data: {
          balance: { increment: teacherNetAmount },
          totalEarned: { increment: teacherNetAmount },
        },
      });

      // Increment course student count
      await tx.course.update({
        where: { id: order.courseId },
        data: { countStudent: { increment: 1 } },
      });

      // Increment voucher usage if applicable
      if (order.voucherId) {
        await tx.voucher.update({
          where: { id: order.voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Add student to course conversation if exists
      if (order.course.conversationId) {
        const existingMember = await tx.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: order.course.conversationId,
              userId: order.userId,
            },
          },
        });

        if (!existingMember) {
          await tx.conversationMember.create({
            data: {
              conversationId: order.course.conversationId,
              userId: order.userId,
              role: 'member',
            },
          });
        }
      }
    });

    const response: successResponse = {
      message: 'Payment captured successfully',
      data: {
        orderId: order.id,
        orderCode: order.Order_id,
        paymentId: captureId,
        status: OrderStatus.success,
      },
    };

    return response;
  }

  async checkPurchase(courseId: string, currentUser: currentClientUser) {
    const order = await this.prisma.order.findUnique({
      where: {
        userId_courseId: {
          userId: currentUser.id,
          courseId: courseId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const hasPurchased = order?.status === OrderStatus.success;

    const response: successResponse = {
      message: 'Check purchase status successfully',
      data: {
        hasPurchased,
        orderId: order?.id || null,
      },
    };

    return response;
  }

  private async saveOrderRecord(
    existingOrderId: string | undefined,
    data: Prisma.OrderUncheckedCreateInput,
  ) {
    if (existingOrderId) {
      return this.prisma.order.update({
        where: { id: existingOrderId },
        data: data as Prisma.OrderUncheckedUpdateInput,
      });
    }

    return this.prisma.order.create({
      data,
    });
  }

  private calculateFinalPrice(coursePrice: number, voucher: Voucher | null) {
    if (!voucher) {
      return Math.round(coursePrice * 100) / 100;
    }

    if (voucher.discountType === DiscountType.percentage) {
      const remaining = coursePrice * (1 - voucher.discountValue / 100);
      return Math.round(Math.max(remaining, 0) * 100) / 100;
    }

    const remaining = coursePrice - voucher.discountValue;
    return Math.round(Math.max(remaining, 0) * 100) / 100;
  }

  private async validateVoucher(code: string, courseId: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code },
    });

    if (!voucher) {
      throw new BadRequestException('Voucher code is invalid');
    }

    if (voucher.status !== Status.active) {
      throw new BadRequestException('Voucher is not active');
    }

    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException('Voucher is expired or not yet valid');
    }

    if (voucher.courseId && voucher.courseId !== courseId) {
      throw new BadRequestException(
        'Voucher is not applicable for this course',
      );
    }

    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      throw new BadRequestException('Voucher usage limit exceeded');
    }

    return voucher;
  }

  private async incrementCounters(
    order: {
      courseId: string;
      voucherId?: string | null;
      id: string;
    },
    userId: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: order.courseId },
      select: { conversationId: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: order.courseId },
        data: { countStudent: { increment: 1 } },
      });

      if (order.voucherId) {
        await tx.voucher.update({
          where: { id: order.voucherId },
          data: { usedCount: { increment: 1 } },
        });
      }

      if (course?.conversationId) {
        const existingMember = await tx.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: course.conversationId,
              userId: userId,
            },
          },
        });

        if (!existingMember) {
          await tx.conversationMember.create({
            data: {
              conversationId: course.conversationId,
              userId: userId,
              role: 'member',
            },
          });
        }
      }
    });
  }
}
