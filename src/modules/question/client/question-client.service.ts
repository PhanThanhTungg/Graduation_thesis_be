import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeminiService } from 'src/shared/AI/gemini/gemini.service';
import { LoggingService } from 'src/shared/logging/logging.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { GenerateQuestionsDto, Model } from './dto/generate.dto';
import genQuestionPrompt from 'src/shared/AI/prompt/question/genQuestion.prompt';
import { successResponse } from 'src/common/interfaces/response.interface';
import { GroqService } from 'src/shared/AI/groq/groq.service';
import fileUtils from 'src/common/utils/file.util';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { answerQuestionPrompt } from 'src/shared/AI/prompt/question/answer.prompt';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly groqService: GroqService,
    private readonly loggingService: LoggingService,
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

    const prompt = genQuestionPrompt.lesson(
      lesson.title,
      lesson.promptForGenQues,
      dto,
    );
    let questions, dataRes;

    switch (dto.model) {
      case Model.GROQ:
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
      case Model.GEMINI: {
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
      case Model.GROQ:
        aiResponse = await this.groqService.generateContent({
          prompt,
        });
        break;
      case Model.GEMINI:
        aiResponse = await this.geminiService.generateContent({
          prompt,
        });
        break;
      default:
        throw new BadRequestException('Invalid model');
    }
    aiResponse = JSON.parse(
      aiResponse.text.replace('```json', '').replace('```', ''),
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
    const response: successResponse = {
      message: 'Answer question successfully',
      data: updatedQuestion,
    };
    return response;
  }

  private async getQuestion(questionId: string, userId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        user: true,
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.userId !== userId)
      throw new BadRequestException('You are not the owner of this question');
    return question;
  }
}
