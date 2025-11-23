import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { GetWithdrawalsDto } from './dto/get-withdrawals.dto';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class FinanceClientService {
  constructor(private readonly prisma: PrismaService) {}

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
        orderBy: {
          createdAt: 'desc',
        },
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
          status: true,
          bankName: true,
          bankAccount: true,
          bankAccountName: true,
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
}
