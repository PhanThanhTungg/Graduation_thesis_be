import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { DiscountType, Status } from '@prisma/client';

@Injectable()
export class VoucherClientService {
  constructor(private readonly prisma: PrismaService) {}

  async createVoucher(dto: CreateVoucherDto, currentUser: currentClientUser) {
    // Check if course exists and belongs to teacher
    if (dto.courseId) {
      const course = await this.prisma.course.findFirst({
        where: {
          id: dto.courseId,
          deletedAt: null,
          teacherId: currentUser.id,
        },
      });

      if (!course) {
        throw new BadRequestException('Course not found or you do not have permission');
      }
    }

    // Check if voucher code already exists
    const existingVoucher = await this.prisma.voucher.findUnique({
      where: { code: dto.code },
    });

    if (existingVoucher) {
      throw new BadRequestException('Voucher code already exists');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate discount value
    if (dto.discountType === DiscountType.percentage && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        code: dto.code,
        courseId: dto.courseId || null,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        startDate: startDate,
        endDate: endDate,
        usageLimit: dto.usageLimit || null,
        createdBy: currentUser.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const response: successResponse = {
      message: 'Create voucher successfully',
      data: voucher,
    };
    return response;
  }

  async updateVoucher(id: string, dto: UpdateVoucherDto, currentUser: currentClientUser) {
    // Check if voucher exists and belongs to user
    const voucher = await this.prisma.voucher.findFirst({
      where: {
        id,
        createdBy: currentUser.id,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found or you do not have permission');
    }

    // Check if course exists and belongs to teacher (if courseId is updated)
    if (dto.courseId) {
      const course = await this.prisma.course.findFirst({
        where: {
          id: dto.courseId,
          deletedAt: null,
          teacherId: currentUser.id,
        },
      });

      if (!course) {
        throw new BadRequestException('Course not found or you do not have permission');
      }
    }

    // Check if voucher code already exists (if code is updated)
    if (dto.code && dto.code !== voucher.code) {
      const existingVoucher = await this.prisma.voucher.findUnique({
        where: { code: dto.code },
      });

      if (existingVoucher) {
        throw new BadRequestException('Voucher code already exists');
      }
    }

    // Validate dates
    const startDate = dto.startDate ? new Date(dto.startDate) : voucher.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : voucher.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate discount value
    const discountType = dto.discountType || voucher.discountType;
    const discountValue = dto.discountValue !== undefined ? dto.discountValue : voucher.discountValue;

    if (discountType === DiscountType.percentage && discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    const updateData: any = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.courseId !== undefined) updateData.courseId = dto.courseId;
    if (dto.discountType !== undefined) updateData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discountValue = dto.discountValue;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit;
    if (dto.status !== undefined) updateData.status = dto.status;

    const updatedVoucher = await this.prisma.voucher.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const response: successResponse = {
      message: 'Update voucher successfully',
      data: updatedVoucher,
    };
    return response;
  }

  async deleteVoucher(id: string, currentUser: currentClientUser) {
    const voucher = await this.prisma.voucher.findFirst({
      where: {
        id,
        createdBy: currentUser.id,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found or you do not have permission');
    }

    await this.prisma.voucher.delete({
      where: { id },
    });

    const response: successResponse = {
      message: 'Delete voucher successfully',
    };
    return response;
  }

  async getVoucherById(id: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    const response: successResponse = {
      message: 'Get voucher successfully',
      data: voucher,
    };
    return response;
  }

  async getVouchersByCourseId(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const vouchers = await this.prisma.voucher.findMany({
      where: {
        OR: [
          { courseId: courseId },
          { courseId: null }, // Include general vouchers
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
          },
        },
        creator: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: successResponse = {
      message: 'Get vouchers by course successfully',
      data: {
        items: vouchers,
        total: vouchers.length,
      },
    };
    return response;
  }

  async getMyVouchers(currentUser: currentClientUser) {
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        createdBy: currentUser.id,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: successResponse = {
      message: 'Get my vouchers successfully',
      data: {
        items: vouchers,
        total: vouchers.length,
      },
    };
    return response;
  }

  async applyVoucher(dto: ApplyVoucherDto) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: dto.code },
      include: {
        course: true,
      },
    });

    if (!voucher) {
      return {
        message: 'Voucher not found',
        data: {
          isValid: false,
          message: 'Voucher code is invalid',
        },
      };
    }

    // Check if voucher is active
    if (voucher.status !== Status.active) {
      return {
        message: 'Voucher is not active',
        data: {
          isValid: false,
          message: 'Voucher is not active',
        },
      };
    }

    // Check if voucher is expired
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      return {
        message: 'Voucher has expired or not yet started',
        data: {
          isValid: false,
          message: 'Voucher has expired or not yet started',
        },
      };
    }

    // Check if voucher is for specific course
    if (voucher.courseId && voucher.courseId !== dto.courseId) {
      return {
        message: 'Voucher is not applicable for this course',
        data: {
          isValid: false,
          message: 'Voucher is not applicable for this course',
        },
      };
    }

    // Check usage limit
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return {
        message: 'Voucher usage limit exceeded',
        data: {
          isValid: false,
          message: 'Voucher usage limit exceeded',
        },
      };
    }

    // Get course price
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Calculate discount
    let finalPrice = course.price;
    if (voucher.discountType === DiscountType.percentage) {
      finalPrice = course.price * (1 - voucher.discountValue / 100);
    } else {
      finalPrice = Math.max(0, course.price - voucher.discountValue);
    }

    const response: successResponse = {
      message: 'Voucher is valid',
      data: {
        isValid: true,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        originalPrice: course.price,
        finalPrice: Math.round(finalPrice * 100) / 100,
      },
    };
    return response;
  }
}
