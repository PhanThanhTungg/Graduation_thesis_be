import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { GetPlatformTransactionsDto } from './dto/get-platform-transactions.dto';
import { GetWithdrawalsDto } from './dto/get-withdrawals.dto';
import { PlatformTransactionType } from '@prisma/client';

@Injectable()
export class AdminFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformTransactions(
    dto: GetPlatformTransactionsDto,
  ): Promise<successResponse> {
    const {
      page = 1,
      limit = 10,
      type,
      keySearch,
      sortField = 'createdAt',
      sortOrder = 'desc',
    } = dto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (keySearch) {
      where.OR = [
        {
          user: {
            email: { contains: keySearch, mode: 'insensitive' },
          },
        },
        {
          user: {
            fullName: { contains: keySearch, mode: 'insensitive' },
          },
        },
      ];
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [transactions, total] = await Promise.all([
      this.prisma.platformTransaction.findMany({
        where,
        select: {
          id: true,
          walletId: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          description: true,
          performedBy: true,
          userId: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.platformTransaction.count({ where }),
    ]);

    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      userId: transaction.userId || null,
      userName: transaction.user?.fullName || 'N/A',
      userEmail: transaction.user?.email || 'N/A',
      type: transaction.type,
      amount: Math.abs(transaction.amount),
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      status: 'completed' as const,
      description: transaction.description,
      referenceId: null,
      createdAt: transaction.createdAt.toISOString(),
      updatedAt: transaction.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get platform transactions successfully',
      data: {
        transactions: transformedTransactions,
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

  async getWithdrawals(dto: GetWithdrawalsDto): Promise<successResponse> {
    const {
      page = 1,
      limit = 10,
      status,
      keySearch,
      sortField = 'createdAt',
      sortOrder = 'desc',
    } = dto;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (keySearch) {
      where.OR = [
        {
          wallet: {
            user: {
              email: { contains: keySearch, mode: 'insensitive' },
            },
          },
        },
        {
          wallet: {
            user: {
              fullName: { contains: keySearch, mode: 'insensitive' },
            },
          },
        },
        {
          email: { contains: keySearch, mode: 'insensitive' },
        },
      ];
    }

    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

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
          wallet: {
            select: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.withdrawal.count({ where }),
    ]);

    const transformedWithdrawals = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      teacherId: withdrawal.wallet.user.id,
      teacherName: withdrawal.wallet.user.fullName,
      teacherEmail: withdrawal.wallet.user.email,
      amount: withdrawal.amount,
      status: withdrawal.status,
      bankName: null,
      bankAccount: withdrawal.email,
      bankAccountName: withdrawal.wallet.user.fullName,
      note: withdrawal.note,
      rejectionReason: withdrawal.rejectionReason,
      processedBy: withdrawal.processedBy,
      processedAt: withdrawal.processedAt?.toISOString() || null,
      createdAt: withdrawal.createdAt.toISOString(),
      updatedAt: withdrawal.updatedAt?.toISOString() || null,
    }));

    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get withdrawals successfully',
      data: {
        withdrawals: transformedWithdrawals,
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
}
