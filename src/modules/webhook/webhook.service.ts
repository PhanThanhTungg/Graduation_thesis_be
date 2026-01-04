import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AiModel, Difficulty, SprBot, TypeQuestion } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { QuestionService } from '../question/client/question-client.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionService: QuestionService,
  ) {}

  async handleQuestionSpr(userId: string) {
    const studentSetting = await this.prisma.studentSetting.findUnique({
      where: { userId },
    });
    if (!studentSetting)
      throw new NotFoundException('Student setting not found');
    if (!studentSetting.enabledSpr)
      throw new BadRequestException('SPR is not enabled');
    if (!studentSetting.sprInterval)
      throw new BadRequestException('SPR interval not found');
    if (studentSetting.sprBot !== SprBot.chrome_extension)
      throw new BadRequestException('SPR bot is not chrome extension');

    const lastActiveDate = studentSetting.lastActiveDate;
    if (lastActiveDate) {
      const now = new Date();
      const minutesSinceLastActive = Math.floor(
        (now.getTime() - lastActiveDate.getTime()) / (1000 * 60),
      );
      const minutesSprInterval = Math.floor(studentSetting.sprInterval / 60);
      const isDueStudent = minutesSinceLastActive % minutesSprInterval === 0;
      if (!isDueStudent)
        throw new BadRequestException('Student is not due for SPR');
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
        typeQues: string;
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
        WHERE lrs."user_id" = ${userId}
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

    if (!firstDue) return;

    const unAnsweredQuestion = await this.prisma.question.findFirst({
      where: {
        userId,
        isForReview: true,
        answer: null,
      },
    });

    if (unAnsweredQuestion) {
      if (lastActiveDate) {
        const spaceTime =
          new Date().getTime() - new Date(lastActiveDate).getTime();
        if (spaceTime < 24 * 60 * 60 * 1000)
          throw new BadRequestException('Student is not due for SPR');
      }

      await this.updateLastActiveDate(userId);
      return unAnsweredQuestion;
    }

    const newQuestionRes = await this.questionService.generateQuestions(
      firstDue.lessonSlug,
      {
        typeQuestion: firstDue.typeQues as TypeQuestion,
        difficulty: firstDue.difficulty as Difficulty,
        totalQuestion: 1,
        model: studentSetting.sprModel as AiModel,
        isForReview: true,
      },
      userId,
    );

    const newQuestion = newQuestionRes.data[0];

    if (newQuestion) {
      await this.updateLastActiveDate(userId);
      return newQuestion;
    }

    throw new BadRequestException('Failed to generate new question');
  }

  private async updateLastActiveDate(userId: string) {
    await this.prisma.studentSetting.update({
      where: { userId },
      data: { lastActiveDate: new Date() },
    });
  }
}
