import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeminiService } from 'src/shared/AI/gemini/gemini.service';
import { LoggingService } from 'src/shared/logging/logging.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { GenerateQuestionsDto } from './dto/generate.dto';
import genQuestionPrompt from 'src/shared/AI/prompt/question/genQuestion.prompt';
import { successResponse } from 'src/common/interfaces/response.interface';
import { GroqService } from 'src/shared/AI/groq/groq.service';
import fileUtils from 'src/common/utils/file.util';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { answerQuestionPrompt } from 'src/shared/AI/prompt/question/answer.prompt';
import { QuestionHistoryQueryDto } from './dto/question-history-query.dto';
import { AdminSettingService } from 'src/modules/setting/admin/admin-setting.service';
import { AiModel, LessonReviewStatus, Question } from '@prisma/client';
import { transformScore } from 'src/helpers/question.helper';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly groqService: GroqService,
    private readonly adminSettingService: AdminSettingService,
  ) {}

  async generateQuestions(
    lessonSlug: string,
    dto: GenerateQuestionsDto,
    userId: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
      include: {
        files: {
          where: {
            isForAiQues: true,
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (!lesson.isGenQues)
      throw new BadRequestException(
        'Lesson is not configured for AI question generation',
      );

    const unansweredQuestions = await this.getUnansweredQuestion(
      lessonSlug,
      userId,
      dto.isForReview,
    );
    if (unansweredQuestions.data) {
      throw new BadRequestException('You have already answered question');
    }

    const prompt = genQuestionPrompt.lesson(
      lesson.title,
      lesson.promptForGenQues,
      dto,
    );
    let questions, dataRes;

    switch (dto.model) {
      case AiModel.groq:
        questions = await this.groqService.generateContent({
          prompt,
          // files: files.length > 0 ? files : undefined,
        });
        dataRes = JSON.parse(
          questions.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim(),
        );
        break;
      case AiModel.gemini: {
        const files = await Promise.all(
          lesson.files.map(async (file) => {
            const fileData = await fileUtils.fetchFileAsBase64(file.fileUrl);
            return {
              data: fileData,
              mimeType: fileUtils.getMimeType(file.fileName),
            };
          }),
        );
        questions = await this.geminiService.generateContent({
          prompt,
          files: files.length > 0 ? files : undefined,
        });
        dataRes = JSON.parse(
          questions.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim(),
        );
        break;
      }

      default:
        throw new BadRequestException('Invalid model');
    }
    const questionArr: any[] = [];
    questionArr.push(...(Array.isArray(dataRes) ? dataRes : [dataRes]));
    const newQuestions = await Promise.all(
      questionArr.map((question) =>
        this.prisma.question.create({
          data: {
            statement: JSON.stringify(question),
            type: dto.typeQuestion,
            difficulty: dto.difficulty,
            lessonId: lesson.id,
            userId,
            isForReview: dto.isForReview,
          },
        }),
      ),
    );

    const response: successResponse = {
      message: 'Create questions successfully',
      data: newQuestions,
    };
    return response;
  }

  async answerQuestion(
    questionId: string,
    body: AnswerQuestionDto,
    userId: string,
  ): Promise<any> {
    const question = await this.getQuestion(questionId, userId);
    if (question.answer !== null)
      throw new BadRequestException('Question already answered');

    const prompt = answerQuestionPrompt(question, body.answer);

    let aiResponse;
    switch (body.model) {
      case AiModel.groq:
        aiResponse = await this.groqService.generateContent({
          prompt,
        });
        break;
      case AiModel.gemini:
        aiResponse = await this.geminiService.generateContent({
          prompt,
        });
        break;
      default:
        throw new BadRequestException('Invalid model');
    }
    console.log('aiResponse:', aiResponse.text);
    aiResponse = JSON.parse(
      aiResponse.text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim(),
    );

    const updatedQuestion = await this.prisma.question.update({
      where: { id: questionId },
      data: {
        answer: body.answer,
        score: aiResponse.score,
        explain: aiResponse.explain,
        aiFeedback: aiResponse.aiFeedback,
      },
    });
    // await this.updateLessonReviewStateOnAnswer(question.userId, question.lessonId, aiResponse.score);
    const response: successResponse = {
      message: 'Answer question successfully',
      data: updatedQuestion,
    };
    return response;
  }

  async getQuestion(questionId: string, userId: string): Promise<Question> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        user: true,
        lesson: true,
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.userId !== userId)
      throw new BadRequestException('You are not the owner of this question');
    return question;
  }

  async getQuestionHistory(
    lessonSlug: string,
    userId: string,
    query: QuestionHistoryQueryDto,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Build where clause with filters
    const where: any = {
      lessonId: lesson.id,
      userId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.isForReview !== undefined) {
      where.isForReview = query.isForReview;
    }

    // Count total items
    const totalItems = await this.prisma.question.count({ where });

    // Calculate pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);

    // Build orderBy clause
    const orderBy: any = {};
    if (query.sortBy === 'date') {
      orderBy.createdAt = query.sortOrder || 'desc';
    } else if (query.sortBy === 'score') {
      orderBy.score = query.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch questions with pagination
    const questions = await this.prisma.question.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        statement: true,
        type: true,
        difficulty: true,
        answer: true,
        score: true,
        explain: true,
        aiFeedback: true,
        createdAt: true,
      },
    });

    const response: successResponse = {
      message: 'Get question history successfully',
      data: questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
    return response;
  }

  async getUnansweredQuestion(
    lessonSlug: string,
    userId: string,
    isForReview: boolean = false,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    // Find the first question without an answer for this user and lesson
    const unansweredQuestion = await this.prisma.question.findFirst({
      where: {
        lessonId: lesson.id,
        userId,
        answer: null,
        isForReview,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const response: successResponse = {
      message: unansweredQuestion
        ? 'Unanswered question found'
        : 'No unanswered questions',
      data: unansweredQuestion,
    };
    return response;
  }

  async scoreQuestionForSpr(questionId: string, userId: string) {
    const question = await this.getQuestion(questionId, userId);
    if (!question.answer)
      throw new BadRequestException('Question not answered');
    if (!question.score)
      throw new BadRequestException('Question already scored');

    const lessonReviewSetting = await this.prisma.lessonReviewSetting.findFirst(
      {
        where: {
          userId,
          lessonId: question.lessonId,
        },
      },
    );

    const adminSetting = (await this.adminSettingService.getSettings()).data;
    if (!adminSetting) throw new BadRequestException('Admin setting not found');

    if (!lessonReviewSetting)
      throw new BadRequestException('Lesson review setting not found');
    if (!lessonReviewSetting.reviewEnabled)
      throw new BadRequestException('Lesson review is not enabled');
    if (lessonReviewSetting.status === LessonReviewStatus.suspending)
      throw new BadRequestException('Lesson review is suspending');

    const evalScore = transformScore(question.score);
    let {
      easinessFactor: lsEF,
      interval: lsInterval,
      status: lsStatus,
      reviewStep: lsReviewStep,
      lapsed: lsLapsed,
    } = lessonReviewSetting;
    const {
      learningSteps: stLeanringSteps,
      lastStepFromLearningToReview: stLastStepFromLearningToReview,
      iniInterval: stIniInterval,
      iniEasyInterval: stIniEasyInterval,
      leechThreshold: stLeechThreshold,
    } = adminSetting;

    if (evalScore !== 0) lsLapsed = 0;
    if (
      lsStatus === LessonReviewStatus.new ||
      lsStatus === LessonReviewStatus.learning
    ) {
      if (evalScore === 0) lsLapsed += 1;

      if (evalScore <= 1) {
        lsReviewStep = lsReviewStep >= 1 ? lsReviewStep - 1 : 0;
        lsInterval = stLeanringSteps[lsReviewStep];
      } else if (evalScore === 4) {
        if (lsReviewStep >= stLastStepFromLearningToReview) {
          lsStatus = LessonReviewStatus.reviewing;
          lsInterval = stIniInterval;
        } else {
          lsReviewStep += 1;
          lsInterval = stLeanringSteps[lsReviewStep];
        }
      } else if (evalScore === 5) {
        lsStatus = LessonReviewStatus.reviewing;
        lsInterval = stIniEasyInterval;
      }

      if (lsStatus === LessonReviewStatus.new) {
        lsStatus = LessonReviewStatus.learning;
        lsInterval = stLeanringSteps[lsReviewStep - 1];
      }
    } else if (lsStatus === LessonReviewStatus.reviewing) {
      if (evalScore === 0) {
        lsStatus = LessonReviewStatus.learning;
        lsReviewStep = stLastStepFromLearningToReview - 2;
        lsInterval = stLeanringSteps[lsReviewStep];
      } else if (evalScore <= 3) {
        lsStatus = LessonReviewStatus.lapsed;
        lsInterval *= 0.25 * evalScore;
      } else if (evalScore <= 5) {
        lsEF += 0.1 - (5 - evalScore) * (0.08 + (5 - evalScore) * 0.02);
        lsInterval *= lsEF;
      }
    } else if (lsStatus === LessonReviewStatus.lapsed) {
      if (evalScore === 0) {
        lsStatus = LessonReviewStatus.learning;
        lsReviewStep = stLastStepFromLearningToReview - 1;
        lsInterval = stLeanringSteps[lsReviewStep];
      } else if (evalScore <= 3) {
        lsStatus = LessonReviewStatus.lapsed;
        lsReviewStep = stLastStepFromLearningToReview;
        lsInterval = stLeanringSteps[lsReviewStep];
      } else if (evalScore <= 5) {
        lsStatus = LessonReviewStatus.reviewing;
        lsInterval = stIniInterval;
        lsInterval = stLeanringSteps[lsReviewStep];
      }
    }

    await this.prisma.lessonReviewSetting.update({
      where: {
        id: lessonReviewSetting.id,
      },
      data: {
        easinessFactor: lsEF,
        interval: lsInterval,
        status: lsStatus,
        reviewStep: lsReviewStep,
        lapsed: lsLapsed,
        lastReviewedAt: new Date(),
      },
    });
  }
}
