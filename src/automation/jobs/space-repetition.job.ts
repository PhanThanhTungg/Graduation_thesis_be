import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  AiModel,
  Difficulty,
  Question,
  SprBot,
  TypeQuestion,
} from '@prisma/client';
import { TelegramService } from 'src/modules/bot/telegram/telegram.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { formatQuestionForTelegram } from 'src/helpers/question.helper';
import { QuestionService } from 'src/modules/question/client/question-client.service';

@Injectable()
export class SpaceRepetitionJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly questionService: QuestionService,
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
        await this.updateLastActiveDate(student.userId);
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
          difficulty: Difficulty;
          typeQues: TypeQuestion;
          lessonSlug: string;
          lessonTitle: string;
          timeSinceLastReview: number | null;
        }[]
      >`
        SELECT 
          lrs."id",
          lrs."easiness_factor" AS "easinessFactor",
          lrs."interval" AS "interval",
          lrs."status",
          lrs."review_step" AS "reviewStep",
          lrs."lapsed",
          lrs."last_reviewed_at" AS "lastReviewedAt",
          lrs."note",
          lrs."difficulty",
          lrs."type_ques" AS "typeQues",
          l."slug" AS "lessonSlug",
          l."title" AS "lessonTitle",
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - lrs."last_reviewed_at")) AS "timeSinceLastReview"
        FROM "LessonReviewSetting" lrs
        JOIN "lesson" l ON lrs."lesson_id" = l.id
        WHERE lrs."user_id" = ${student.userId}
          AND lrs."review_enabled" = true
          AND (
            lrs."last_reviewed_at" IS NULL 
            OR EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - lrs."last_reviewed_at")) >= lrs."interval"
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
      if (unAnsweredQuestion) {
        const spaceTime =
          new Date().getTime() - new Date(student.lastActiveDate).getTime();
        if (spaceTime < 24 * 60 * 60 * 1000) continue;
        if (student.sprBot === SprBot.telegram) {
          await this.sendQuestionToTelegram(
            unAnsweredQuestion,
            student.telegramId as string,
          );
        }
        await this.updateLastActiveDate(student.userId);
        continue;
      }

      const newQuestionRes = await this.questionService.generateQuestions(
        firstDue.lessonSlug,
        {
          typeQuestion: firstDue.typeQues,
          difficulty: firstDue.difficulty,
          totalQuestion: 1,
          model: student.sprModel,
          isForReview: true,
        },
        student.userId,
      );

      const newQuestion = newQuestionRes.data[0];

      if (newQuestion) {
        await this.sendQuestionToTelegram(
          newQuestion,
          student.telegramId as string,
        );
      }
    }
  }

  private async updateLastActiveDate(userId: string) {
    await this.prisma.studentSetting.update({
      where: {
        userId: userId,
      },
      data: {
        lastActiveDate: new Date(),
      },
    });
  }

  private async sendQuestionToTelegram(question: Question, userId: string) {
    const formattedQuestion = formatQuestionForTelegram({
      type: question.type,
      statement: question.statement,
    });
    await this.telegramService.sendMessage(
      userId,
      `<b>Question (${question.type}):</b>\n${formattedQuestion}\n\n<code>${question.id}</code>`,
    );
  }
}
