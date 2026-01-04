import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { GetWithdrawalsDto } from './dto/get-withdrawals.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CaptureDepositDto } from './dto/capture-deposit.dto';
import { QueueProducerService } from 'src/shared/rabbitmq/queue-producer.service';
import { QueueName } from 'src/shared/rabbitmq/queue.constants';
import { WithdrawalMessage } from 'src/shared/rabbitmq/interfaces/withdrawal-message.interface';
import { PaypalService } from 'src/modules/payment/paypal.service';
import { EnvService } from 'src/shared/env/env.service';
import {
  TransactionType,
  TransactionStatus,
  OrderStatus,
} from '@prisma/client';

@Injectable()
export class FinanceClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueProducer: QueueProducerService,
    private readonly paypalService: PaypalService,
    private readonly envService: EnvService,
  ) {}

  async getWallet(currentUser: currentClientUser) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
      select: {
        id: true,
        userId: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        totalEarned: true,
        totalSpent: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const response: successResponse = {
      message: 'Get wallet successfully',
      data: wallet,
    };

    return response;
  }

  async getTransactions(
    dto: GetTransactionsDto,
    currentUser: currentClientUser,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      walletId: wallet.id,
    };

    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    const sortField = dto.sortField || 'createdAt';
    const sortOrder = dto.sortOrder || 'desc';

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        select: {
          id: true,
          walletId: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          status: true,
          description: true,
          referenceId: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get transactions successfully',
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };

    return response;
  }

  async getWithdrawals(dto: GetWithdrawalsDto, currentUser: currentClientUser) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
      select: { id: true },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      walletId: wallet.id,
    };

    if (dto.status) {
      where.status = dto.status;
    }

    const [withdrawals, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where,
        select: {
          id: true,
          walletId: true,
          amount: true,
          email: true,
          status: true,
          note: true,
          rejectionReason: true,
          processedBy: true,
          processedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get withdrawals successfully',
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };

    return response;
  }

  async getOrders(dto: GetOrdersDto, currentUser: currentClientUser) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      course: {
        teacherId: currentUser.id,
      },
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.courseId) {
      where.courseId = dto.courseId;
    }

    const sortField = dto.sortField || 'createdAt';
    const sortOrder = dto.sortOrder || 'desc';

    const orderBy: any = {};
    if (sortField === 'finalPrice') {
      orderBy.finalPrice = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          Order_id: true,
          userId: true,
          courseId: true,
          discountAmount: true,
          finalPrice: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          completedAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get orders successfully',
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };

    return response;
  }

  async createWithdrawal(
    dto: CreateWithdrawalDto,
    currentUser: currentClientUser,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount: dto.amount,
        email: dto.email,
        note: dto.note,
        status: TransactionStatus.pending,
      },
      select: {
        id: true,
        walletId: true,
        amount: true,
        email: true,
        status: true,
        note: true,
        createdAt: true,
      },
    });

    await this.queueProducer.sendToQueue<WithdrawalMessage>(
      QueueName.WITHDRAWAL_PROCESSING,
      {
        withdrawalId: withdrawal.id,
        walletId: withdrawal.walletId,
        amount: withdrawal.amount,
        email: withdrawal.email,
      },
    );

    const response: successResponse = {
      message: 'Withdrawal request created successfully',
      data: withdrawal,
    };

    return response;
  }

  async createDeposit(dto: CreateDepositDto, currentUser: currentClientUser) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const depositId = `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const redirectBase = this.envService.get('PAYPAL_REDIRECT_BASE_URL');

    const paypalOrder = await this.paypalService.createOrder({
      amount: dto.amount,
      currency: 'USD',
      description: `Deposit ${dto.amount} to wallet`,
      invoiceId: depositId,
      returnUrl: `${redirectBase}/payment/success?type=deposit`,
      cancelUrl: `${redirectBase}/payment/cancel?type=deposit`,
    });

    const approvalUrl = paypalOrder?.links?.find(
      (link: any) => link.rel === 'approve',
    )?.href;

    if (!approvalUrl) {
      throw new BadRequestException('Unable to generate PayPal approval link');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: TransactionType.deposit,
        amount: dto.amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        status: TransactionStatus.pending,
        description: `Deposit ${dto.amount}`,
        referenceId: depositId,
        metadata: {
          paypalOrderId: paypalOrder.id,
        },
      },
    });

    const response: successResponse = {
      message: 'Created deposit order successfully',
      data: {
        transactionId: transaction.id,
        approvalUrl,
        paypalOrderId: paypalOrder.id,
      },
    };

    return response;
  }

  async captureDeposit(
    transactionId: string,
    dto: CaptureDepositDto,
    currentUser: currentClientUser,
  ) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: currentUser.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.walletId !== wallet.id) {
      throw new BadRequestException('Transaction does not belong to you');
    }

    if (transaction.status !== TransactionStatus.pending) {
      throw new BadRequestException('Transaction is not pending');
    }

    if (transaction.type !== TransactionType.deposit) {
      throw new BadRequestException('Transaction is not a deposit');
    }

    const metadata = transaction.metadata as any;
    if (metadata?.paypalOrderId !== dto.paypalOrderId) {
      throw new BadRequestException('PayPal order ID mismatch');
    }

    const capture = await this.paypalService.captureOrder(dto.paypalOrderId);

    if (capture.status !== 'COMPLETED') {
      throw new BadRequestException('Payment has not been completed');
    }

    const captureId =
      capture?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
      dto.paypalOrderId;

    await this.prisma.$transaction(async (tx) => {
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + transaction.amount;

      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.completed,
          balanceAfter,
          metadata: {
            paypalOrderId: dto.paypalOrderId,
            captureId,
          },
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          totalDeposited: wallet.totalDeposited + transaction.amount,
        },
      });
    });

    const response: successResponse = {
      message: 'Deposit captured successfully',
      data: {
        transactionId: transaction.id,
        captureId,
        amount: transaction.amount,
      },
    };

    return response;
  }
}
