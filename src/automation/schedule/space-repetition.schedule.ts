import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SprBot } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { QueueProducerService } from 'src/shared/rabbitmq/queue-producer.service';
import { QueueName } from 'src/shared/rabbitmq/queue.constants';
import { SpaceRepetitionQuestionMessage } from 'src/shared/rabbitmq/interfaces/space-repetition-message.interface';

@Injectable()
export class SpaceRepetitionJob {
  private readonly logger = new Logger(SpaceRepetitionJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueProducerService: QueueProducerService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handle() {
    try {
      const dueStudents = await this.prisma.$queryRaw<
        {
          userId: string;
          sprBot: SprBot;
          sprModel: string;
          telegramId: string | null;
          discordId: string | null;
          lastActiveDate: Date | null;
        }[]
      >`
        SELECT 
          "user_id" AS "userId",
          "telegram_id" AS "telegramId",
          "discord_id" AS "discordId",
          "spr_bot" AS "sprBot",
          "spr_model" AS "sprModel",
          "last_active_date" AS "lastActiveDate"
        FROM "StudentSetting"
        WHERE "enabled_spr" = true
          AND ("spr_bot" = 'telegram' OR "spr_bot" = 'discord')
          AND ("telegram_id" IS NOT NULL OR "discord_id" IS NOT NULL)
          AND (
            "last_active_date" IS NULL
            OR (EXTRACT(EPOCH FROM (NOW() - "last_active_date"))::bigint / 60)
              % ("spr_interval"::bigint / 60) = 0
          )
      `;

      for (const student of dueStudents) {
        const message: SpaceRepetitionQuestionMessage = {
          userId: student.userId,
          telegramId: student.telegramId,
          discordId: student.discordId,
          sprBot: student.sprBot,
          sprModel: student.sprModel,
        };

        try {
          await this.queueProducerService.sendToQueue(
            QueueName.SPACE_REPETITION_QUESTION,
            message,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send message for user ${student.userId}:`,
            error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in space repetition job:', error);
    }
  }
}
