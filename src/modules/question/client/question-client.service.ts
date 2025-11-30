import { Injectable, NotFoundException } from '@nestjs/common';
import { GeminiService } from 'src/shared/AI/gemini/gemini.service';
import { LoggingService } from 'src/shared/logging/logging.service';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class QuestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    private readonly loggingService: LoggingService,
  ) {}

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
    console.log(lesson);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const questions = await this.geminiService.generateContent({
      prompt: `Generate 10 questions for the lesson ${lesson.title}`,
    });
    return questions;
  }
}
