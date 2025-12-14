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
      lastReviewedAt: setting.lastReviewedAt,
      note: setting.note,
      difficulty: setting.difficulty,
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

  async getLessonReviewSettingByLessonId(
    lessonId: string,
    userId: string,
  ): Promise<LessonReviewSettingDto> {
    const reviewSetting = await this.prisma.lessonReviewSetting.findFirst({
      where: {
        lessonId,
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
    });

    if (!reviewSetting) {
      throw new NotFoundException('Lesson review setting not found');
    }

    return {
      id: reviewSetting.id,
      reviewEnabled: reviewSetting.reviewEnabled,
      easinessFactor: reviewSetting.easinessFactor,
      intervalDays: reviewSetting.intervalDays,
      status: reviewSetting.status,
      reviewStep: reviewSetting.reviewStep,
      lapsed: reviewSetting.lapsed,
      lastReviewedAt: reviewSetting.lastReviewedAt,
      note: reviewSetting.note,
      difficulty: reviewSetting.difficulty,
      userId: reviewSetting.userId,
      lessonId: reviewSetting.lessonId,
      lessonTitle: reviewSetting.lesson.title,
      courseTitle: reviewSetting.lesson.chapter.course.title,
      courseId: reviewSetting.lesson.chapter.course.id,
      chapterId: reviewSetting.lesson.chapter.id,
      chapterTitle: reviewSetting.lesson.chapter.title,
    };
  }

  async updateLessonReviewSetting(
    lessonId: string,
    userId: string,
    updateDto: { reviewEnabled?: boolean; note?: string },
  ): Promise<LessonReviewSettingDto> {
    const reviewSetting = await this.prisma.lessonReviewSetting.findFirst({
      where: {
        lessonId,
        userId,
      },
    });

    if (!reviewSetting) {
      throw new NotFoundException('Lesson review setting not found');
    }

    const updateData: { reviewEnabled?: boolean; note?: string } = {};
    if (updateDto.reviewEnabled !== undefined) {
      updateData.reviewEnabled = updateDto.reviewEnabled;
    }
    if (updateDto.note !== undefined) {
      updateData.note = updateDto.note;
    }

    const updatedSetting = await this.prisma.lessonReviewSetting.update({
      where: {
        id: reviewSetting.id,
      },
      data: updateData,
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
    });

    return {
      id: updatedSetting.id,
      reviewEnabled: updatedSetting.reviewEnabled,
      easinessFactor: updatedSetting.easinessFactor,
      intervalDays: updatedSetting.intervalDays,
      status: updatedSetting.status,
      reviewStep: updatedSetting.reviewStep,
      lapsed: updatedSetting.lapsed,
      lastReviewedAt: updatedSetting.lastReviewedAt,
      note: updatedSetting.note,
      difficulty: updatedSetting.difficulty,
      userId: updatedSetting.userId,
      lessonId: updatedSetting.lessonId,
      lessonTitle: updatedSetting.lesson.title,
      courseTitle: updatedSetting.lesson.chapter.course.title,
      courseId: updatedSetting.lesson.chapter.course.id,
      chapterId: updatedSetting.lesson.chapter.id,
      chapterTitle: updatedSetting.lesson.chapter.title,
    };
  }
}
