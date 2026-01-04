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
import { QueueProducerService } from 'src/shared/rabbitmq/queue-producer.service';
import { QueueName } from 'src/shared/rabbitmq/queue.constants';
import { WithdrawalMessage } from 'src/shared/rabbitmq/interfaces/withdrawal-message.interface';
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

    const systemFee = await this.prisma.systemFee.findFirst({
      orderBy: { createdAt: 'desc' },
    });

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
}
