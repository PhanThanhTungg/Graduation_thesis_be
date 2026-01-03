import {
  ConsoleLogger,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { QueueConsumerService } from 'src/shared/rabbitmq/queue-consumer.service';
import { QueueName } from 'src/shared/rabbitmq/queue.constants';
import { SpaceRepetitionQuestionMessage } from 'src/shared/rabbitmq/interfaces/space-repetition-message.interface';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TelegramService } from 'src/modules/bot/telegram/telegram.service';
import { QuestionService } from 'src/modules/question/client/question-client.service';
import {
  SprBot,
  Question,
  TypeQuestion,
  Difficulty,
  AiModel,
} from '@prisma/client';
import { formatQuestionForTelegram } from 'src/helpers/question.helper';

@Injectable()
export class SpaceRepetitionWorker implements OnModuleInit {
  private readonly logger = new Logger(SpaceRepetitionWorker.name);

  constructor(
    private readonly queueConsumerService: QueueConsumerService,
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly questionService: QuestionService,
  ) {}

  async onModuleInit() {
    await this.queueConsumerService.consume<SpaceRepetitionQuestionMessage>(
      QueueName.SPACE_REPETITION_QUESTION,
      this.handleMessage.bind(this),
    );
  }

  private async handleMessage(message: SpaceRepetitionQuestionMessage) {
    try {
      const student = await this.prisma.studentSetting.findUnique({
        where: { userId: message.userId },
      });

      if (!student || !student.enabledSpr || !student.sprBot) {
        return;
      }

      if (!student.lastActiveDate) {
        await this.updateLastActiveDate(message.userId);
        return;
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
        WHERE lrs."user_id" = ${message.userId}
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
          userId: message.userId,
          isForReview: true,
          answer: null,
        },
      });

      if (unAnsweredQuestion) {
        const spaceTime =
          new Date().getTime() - new Date(student.lastActiveDate).getTime();
        if (spaceTime < 24 * 60 * 60 * 1000) return;

        if (student.sprBot === SprBot.telegram && message.telegramId) {
          await this.sendQuestionToTelegram(
            unAnsweredQuestion,
            message.telegramId,
          );
        }
        await this.updateLastActiveDate(message.userId);
        return;
      }

      const newQuestionRes = await this.questionService.generateQuestions(
        firstDue.lessonSlug,
        {
          typeQuestion: firstDue.typeQues as TypeQuestion,
          difficulty: firstDue.difficulty as Difficulty,
          totalQuestion: 1,
          model: message.sprModel as AiModel,
          isForReview: true,
        },
        message.userId,
      );

      const newQuestion = newQuestionRes.data[0];

      if (
        newQuestion &&
        student.sprBot === SprBot.telegram &&
        message.telegramId
      ) {
        await this.sendQuestionToTelegram(newQuestion, message.telegramId);
      }

      await this.updateLastActiveDate(message.userId);
    } catch (error) {
      this.logger.error(
        `Error processing space repetition message for user ${message.userId}:`,
        error,
      );
      if (message.sprBot === SprBot.telegram && message.telegramId) {
        await this.telegramService.sendMessage(
          message.telegramId,
          `🚫 <code>failed to send question: ${error.message}</code>`,
        );
      }
      throw error;
    }
  }

  private async updateLastActiveDate(userId: string) {
    await this.prisma.studentSetting.update({
      where: { userId },
      data: { lastActiveDate: new Date() },
    });
  }

  private async sendQuestionToTelegram(question: Question, telegramId: string) {
    const formattedQuestion = formatQuestionForTelegram({
      type: question.type,
      statement: question.statement,
    });
    await this.telegramService.sendMessage(
      telegramId,
      `<b>Question (${question.type}):</b>\n${formattedQuestion}\n\n<code>${question.id}</code>`,
    );
  }
}
