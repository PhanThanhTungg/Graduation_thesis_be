import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LessonService } from '../lesson/client/lesson-client.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { LessonReviewSettingDto } from './dto/lesson-review-setting.dto';

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

  async getLessonReviewSettings(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: LessonReviewSettingDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [reviewSettings, total] = await Promise.all([
      this.prisma.lessonReviewSetting.findMany({
        where: {
          userId,
        },
        include: {
          lesson: {
            include: {
              chapter: {
                include: {
                  course: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.lessonReviewSetting.count({
        where: {
          userId,
        },
      }),
    ]);

    const data = reviewSettings.map((setting) => ({
      id: setting.id,
      reviewEnabled: setting.reviewEnabled,
      easinessFactor: setting.easinessFactor,
      intervalDays: setting.intervalDays,
      status: setting.status,
      reviewStep: setting.reviewStep,
      lapsed: setting.lapsed,
      userId: setting.userId,
      lessonId: setting.lessonId,
      lessonTitle: setting.lesson.title,
      courseTitle: setting.lesson.chapter.course.title,
      courseId: setting.lesson.chapter.course.id,
      chapterId: setting.lesson.chapter.id,
      chapterTitle: setting.lesson.chapter.title,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
