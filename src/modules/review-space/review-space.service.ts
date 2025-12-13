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

  async toggleLessonInReviewSpace(lessonId: string, userId: string) {
    const lesson = await this.lessonService.getLessonById(lessonId);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if lesson already exists in review space
    const existingReviewSetting =
      await this.prisma.lessonReviewSetting.findUnique({
        where: {
          lessonId,
        },
      });

    if (existingReviewSetting) {
      // Remove from review space
      await this.prisma.lessonReviewSetting.delete({
        where: {
          lessonId,
        },
      });

      const response: successResponse = {
        message: 'Lesson removed from review space successfully',
        data: { isInReviewSpace: false },
      };
      return response;
    } else {
      // Add to review space
      const lessonReviewSetting = await this.prisma.lessonReviewSetting.create({
        data: {
          lessonId,
          userId,
        },
      });

      const response: successResponse = {
        message: 'Lesson added to review space successfully',
        data: { ...lessonReviewSetting, isInReviewSpace: true },
      };
      return response;
    }
  }
}
