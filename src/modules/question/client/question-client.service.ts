import { Injectable, NotFoundException } from '@nestjs/common';
import { GeminiService } from 'src/shared/AI/gemini/gemini.service';
import { LoggingService } from 'src/shared/logging/logging.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import * as mimeTypes from 'mime-types';
import fetch from 'node-fetch';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
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

  async generateQuestions(lessonSlug: string, userId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
        files: true,
      },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');

    const files = await Promise.all(
      lesson.files.map(async (file) => {
        const fileData = await this.fetchFileAsBase64(file.fileUrl);
        return {
          data: fileData,
          mimeType: this.getMimeType(file.fileName),
        };
      }),
    );

    const questions = await this.geminiService.generateContent({
      prompt: `Generate 10 questions for the lesson ${lesson.title}`,
      files: files.length > 0 ? files : undefined,
    });
    return questions;
  }
}
