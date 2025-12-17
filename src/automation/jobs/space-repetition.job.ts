import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiModel, SprBot } from '@prisma/client';
import { TelegramService } from 'src/modules/bot/telegram/telegram.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { formatQuestionForTelegram } from 'src/helpers/question.helper';

@Injectable()
export class SpaceRepetitionJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handle() {
    const dueStudents = await this.prisma.$queryRaw<
      {
        userId: string;
        sprBot: SprBot;
        sprModel: AiModel;
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
        AND ("spr_bot" IS NOT NULL)
        AND ("telegram_id" IS NOT NULL OR "discord_id" IS NOT NULL)
        AND (
          "last_active_date" IS NULL
          OR (EXTRACT(EPOCH FROM (NOW() - "last_active_date"))::bigint / 60)
            % ("spr_interval"::bigint / 60) = 0
        )
    `;

    for (const student of dueStudents) {
      if (!student.lastActiveDate) {
        await this.prisma.studentSetting.update({
          where: {
            userId: student.userId,
          },
          data: {
            lastActiveDate: new Date(),
          },
        });
        continue;
      }
      const [firstDue] = await this.prisma.$queryRaw<
        {
          id: string;
          easinessFactor: number;
          interval: number;
          status: string;
          reviewStep: number;
          lapsed: number;
          lastReviewedAt: Date | null;
          note: string | null;
          difficulty: string;
          lessonId: string;
          lessonTitle: string;
        }[]
      >`
        SELECT
          lrs."id",
          lrs."easiness_factor"  AS "easinessFactor",
          lrs."interval"    AS "interval",
          lrs."status",
          lrs."review_step"      AS "reviewStep",
          lrs."lapsed",
          lrs."last_reviewed_at" AS "lastReviewedAt",
          lrs."note",
          lrs."difficulty",
          lrs."lesson_id"        AS "lessonId",
          l."title"              AS "lessonTitle"
        FROM "LessonReviewSetting" lrs
        JOIN "lesson" l ON lrs."lesson_id" = l.id
        WHERE lrs."user_id" = ${student.userId}
          AND lrs."review_enabled" = true
          AND (
            lrs."last_reviewed_at" IS NULL
            OR lrs."last_reviewed_at" + lrs."interval" * INTERVAL '1 minute' <= NOW()
          )
        ORDER BY
          CASE WHEN lrs."last_reviewed_at" IS NULL THEN 0 ELSE 1 END,
          lrs."last_reviewed_at" ASC
        LIMIT 1
      `;

      if (!firstDue) continue;

      const unAnsweredQuestion = await this.prisma.question.findFirst({
        where: {
          userId: student.userId,
          isForReview: true,
          answer: null,
        },
      });

      if (
        unAnsweredQuestion &&
        new Date().getTime() - new Date(student.lastActiveDate).getTime() >
          24 * 60 * 60 * 1000
      ) {
        const formattedQuestion = formatQuestionForTelegram({
          type: unAnsweredQuestion.type,
          statement: unAnsweredQuestion.statement,
        });
        await this.telegramService.sendMessage(
          student.telegramId as string,
          `<b>Question (${unAnsweredQuestion.type}):</b>\n${formattedQuestion}\n\n<code>${unAnsweredQuestion.id}</code>`,
        );
        continue;
      }

      // const question = await this.prisma.question.findFirst({
      //   where: {
      //     lessonId: firstDue.lessonId,
      //     userId: student.userId,
      //     answer: null,
      //   },
      //   orderBy: {
      //     createdAt: 'asc',
      //   },
      // });

      // if (!question) {
      //   continue;
      // }

      // await this.telegramService.sendMessage(
      //   student.telegramId as string,
      //   `<b>Question:</b>\n${question.statement}\n\n<code>${question.id}</code>`,
      // );
    }
  }
}
