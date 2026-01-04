import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { QueueConsumerService } from 'src/shared/rabbitmq/queue-consumer.service';
import { QueueName } from 'src/shared/rabbitmq/queue.constants';
import { WithdrawalMessage } from 'src/shared/rabbitmq/interfaces/withdrawal-message.interface';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { PaypalService } from 'src/modules/payment/paypal.service';
import { TransactionStatus, TransactionType } from '@prisma/client';

@Injectable()
export class WithdrawalWorker implements OnModuleInit {
  private readonly logger = new Logger(WithdrawalWorker.name);

  constructor(
    private readonly queueConsumerService: QueueConsumerService,
    private readonly prisma: PrismaService,
    private readonly paypalService: PaypalService,
  ) {}

  async onModuleInit() {
    await this.queueConsumerService.consume<WithdrawalMessage>(
      QueueName.WITHDRAWAL_PROCESSING,
      this.handleMessage.bind(this),
    );
  }

  private async handleMessage(message: WithdrawalMessage) {
    try {
      const withdrawal = await this.prisma.withdrawal.findUnique({
        where: { id: message.withdrawalId },
        include: { wallet: true },
      });

      if (!withdrawal) {
        this.logger.error(`Withdrawal not found: ${message.withdrawalId}`);
        return;
      }

      if (withdrawal.status !== TransactionStatus.pending) {
        this.logger.warn(
          `Withdrawal ${message.withdrawalId} is not pending. Current status: ${withdrawal.status}`,
        );
        return;
      }

      await this.prisma.withdrawal.update({
        where: { id: message.withdrawalId },
        data: { status: TransactionStatus.processing },
      });

      const payout = await this.paypalService.createPayout(
        message.email,
        message.amount,
        withdrawal.note || undefined,
      );

      const payoutBatchId = payout?.batch_header?.payout_batch_id;
      const batchStatus = payout?.batch_header?.batch_status;

      if (
        payout &&
        batchStatus &&
        ['SUCCESS', 'PENDING'].includes(batchStatus)
      ) {
        const wallet = withdrawal.wallet;

        await this.prisma.$transaction(async (tx) => {
          await tx.withdrawal.update({
            where: { id: message.withdrawalId },
            data: {
              status: TransactionStatus.completed,
              processedAt: new Date(),
            },
          });

          const balanceBefore = wallet.balance;
          const balanceAfter = balanceBefore - message.amount;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: balanceAfter,
              totalWithdrawn: wallet.totalWithdrawn + message.amount,
            },
          });

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: TransactionType.withdrawal,
              amount: -message.amount,
              balanceBefore,
              balanceAfter,
              status: TransactionStatus.completed,
              description: `Withdrawal to ${message.email}`,
              referenceId: message.withdrawalId,
              metadata: {
                payoutBatchId,
                email: message.email,
              },
            },
          });
        });

        this.logger.log(
          `Withdrawal ${message.withdrawalId} processed successfully`,
        );
      } else {
        await this.prisma.withdrawal.update({
          where: { id: message.withdrawalId },
          data: {
            status: TransactionStatus.cancelled,
            rejectionReason:
              payout?.batch_header?.errors?.[0]?.message || 'Payout failed',
          },
        });

        this.logger.error(
          `Withdrawal ${message.withdrawalId} failed: ${JSON.stringify(payout)}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing withdrawal ${message.withdrawalId}:`,
        error,
      );

      try {
        await this.prisma.withdrawal.update({
          where: { id: message.withdrawalId },
          data: {
            status: TransactionStatus.cancelled,
            rejectionReason:
              error instanceof Error ? error.message : 'Processing error',
          },
        });
      } catch (updateError) {
        this.logger.error(
          `Failed to update withdrawal status for ${message.withdrawalId}:`,
          updateError,
        );
      }

      throw error;
    }
  }
}
