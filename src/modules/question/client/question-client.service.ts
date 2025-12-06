import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GeminiService } from 'src/shared/AI/gemini/gemini.service';
import { LoggingService } from 'src/shared/logging/logging.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import * as mimeTypes from 'mime-types';
import fetch from 'node-fetch';
import { GenerateQuestionsDto, Model } from './dto/generate.dto';
import genQuestionPrompt from 'src/shared/AI/prompt/question/genQuestion.prompt';
import { successResponse } from 'src/common/interfaces/response.interface';
import { GroqService } from 'src/shared/AI/groq/groq.service';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly groqService: GroqService,
    private readonly loggingService: LoggingService,
  ) {}

  private getMimeType(fileName: string): string {
    const mimeType = mimeTypes.lookup(fileName);
    return mimeType || 'application/octet-stream';
  }

  private async fetchFileAsBase64(fileUrl: string): Promise<string> {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from ${fileUrl}: ${response.statusText}`,
      );
    }
    const buffer = await response.buffer();
    return buffer.toString('base64');
  }

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

    const files = await Promise.all(
      lesson.files.map(async (file) => {
        const fileData = await this.fetchFileAsBase64(file.fileUrl);
        return {
          data: fileData,
          mimeType: this.getMimeType(file.fileName),
        };
      }),
    );

    const prompt = genQuestionPrompt.lesson(
      lesson.title,
      lesson.promptForGenQues,
      dto,
    );
    let questions, dataRes;
    if (dto.model === Model.GROQ) {
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
    } else {
      questions = await this.geminiService.generateContent({
        prompt,
        files: files.length > 0 ? files : undefined,
      });
      dataRes = JSON.parse(
        questions.text.replace('```json', '').replace('```', ''),
      );
    }

    const response: successResponse = {
      message: 'Create questions successfully',
      data: dataRes,
    };
    return response;
  }
}
