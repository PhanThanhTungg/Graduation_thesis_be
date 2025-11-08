import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateLessonDto, LessonDto, UpdateLessonDto } from './dto/lesson.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { successResponse } from 'src/common/interfaces/response.interface';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async createLesson(chapterId: string, dto: CreateLessonDto, teacherId: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, deletedAt: null },
      include: {
        course: {
          select: { id: true, teacherId: true },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to create lesson in this chapter');
    }

    const maxPos = await this.prisma.lesson.aggregate({
      where: { chapterId: chapter.id, deletedAt: null },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max.position ?? 0) + 1;

    const lesson = await this.prisma.$transaction(async (tx) => {
      const createdLesson = await tx.lesson.create({
        data: {
          chapterId: chapter.id,
          title: dto.title,
          slug: generateUniqueSlug(dto.title),
          description: dto.description,
          type: dto.type,
          position: nextPosition,
        },
      });

      if (dto.type === 'video' && dto.videoUrl) {
        await tx.videoLesson.create({
          data: {
            lessonId: createdLesson.id,
            videoUrl: dto.videoUrl,
          },
        });
      }

      return createdLesson;
    });

    const response: successResponse = {
      message: 'Create lesson successfully',
      data: lesson,
    };
    return response;
  }

  async getLessonsByChapterId(chapterId: string, teacherId: string, filter: fullObjectFilter & { type?: string } = {}) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, deletedAt: null },
      include: {
        course: {
          select: { id: true, teacherId: true },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to view lessons in this chapter');
    }

    const { keySearch, type, sortField = 'position', sortOrder = 'asc' } = filter;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    const where = {
      chapterId: chapter.id,
      deletedAt: null,
      ...(keySearch && {
        title: { contains: keySearch, mode: 'insensitive' as const },
      }),
      ...(type && { type: type as any }),
    };

    const [total, lessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where }),
      this.prisma.lesson.findMany({
        where,
        include: {
          videoLesson: true,
          theoryFile: true,
          exerciseFile: true,
        },
        ...(sortField && sortOrder && { orderBy: { [sortField]: sortOrder } }),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const response: successResponse = {
      message: 'Get lessons successfully',
      data: {
        items: lessons,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
    return response;
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto, teacherId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        chapter: {
          include: {
            course: {
              select: { id: true, teacherId: true },
            },
          },
        },
        videoLesson: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.chapter.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to update this lesson');
    }

    const updatedLesson = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (dto.title !== undefined) {
        updateData.title = dto.title;
        updateData.slug = generateUniqueSlug(dto.title);
      }

      if (dto.description !== undefined) {
        updateData.description = dto.description;
      }

      if (dto.type !== undefined) {
        updateData.type = dto.type;
      }

      const updated = await tx.lesson.update({
        where: { id: lessonId },
        data: updateData,
        include: {
          videoLesson: true,
          theoryFile: true,
          exerciseFile: true,
        },
      });

      if (dto.type === 'video' && dto.videoUrl !== undefined) {
        if (lesson.videoLesson) {
          await tx.videoLesson.update({
            where: { lessonId: lessonId },
            data: { videoUrl: dto.videoUrl },
          });
        } else if (dto.videoUrl) {
          await tx.videoLesson.create({
            data: {
              lessonId: lessonId,
              videoUrl: dto.videoUrl,
            },
          });
        }
      } else if (dto.type !== 'video' && lesson.videoLesson) {
        await tx.videoLesson.delete({
          where: { lessonId: lessonId },
        });
      }

      return updated;
    });

    const response: successResponse = {
      message: 'Update lesson successfully',
      data: updatedLesson,
    };
    return response;
  }

  async deleteLesson(lessonId: string, teacherId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        chapter: {
          include: {
            course: {
              select: { id: true, teacherId: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.chapter.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to delete this lesson');
    }

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    });

    const response: successResponse = {
      message: 'Delete lesson successfully',
    };
    return response;
  }
}

