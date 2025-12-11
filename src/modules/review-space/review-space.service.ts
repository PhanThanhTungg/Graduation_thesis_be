import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LessonService } from '../lesson/client/lesson-client.service';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class ReviewSpaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonService: LessonService,
  ) {}

  async addLessonToReviewSpace(lessonId: string, userId: string) {
    const lesson = await this.lessonService.getLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    const lessonReviewSetting = await this.prisma.lessonReviewSetting.create({
      data: {
        lessonId,
        userId,
      },
    });

    const response: successResponse = {
      message: 'Lesson added to review space successfully',
      data: lessonReviewSetting,
    };
    return response;
  }
}
