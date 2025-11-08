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
          position: nextPosition,
        },
      });

      if (dto.videoId && dto.embedUrl) {
        await tx.videoLesson.create({
          data: {
            lessonId: createdLesson.id,
            videoId: dto.videoId,
            embedUrl: dto.embedUrl,
            duration: dto.duration,
          },
        });
      }

      if (dto.files && dto.files.length > 0) {
        await tx.file.createMany({
          data: dto.files.map((file) => ({
            lessonId: createdLesson.id,
            fileUrl: file.fileUrl,
            fileName: file.fileName,
            fileSize: file.fileSize,
          })),
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

  async getLessonsByChapterId(chapterId: string, teacherId: string, filter: fullObjectFilter = {}) {
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

    const { keySearch, sortField = 'position', sortOrder = 'asc' } = filter;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    const where = {
      chapterId: chapter.id,
      deletedAt: null,
      ...(keySearch && {
        title: { contains: keySearch, mode: 'insensitive' as const },
      }),
    };

    const [total, lessons] = await this.prisma.$transaction([
      this.prisma.lesson.count({ where }),
      this.prisma.lesson.findMany({
        where,
        include: {
          videoLesson: true,
          files: true,
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

      const updated = await tx.lesson.update({
        where: { id: lessonId },
        data: updateData,
        include: {
          videoLesson: true,
          files: true,
        },
      });

      if (dto.videoId !== undefined || dto.embedUrl !== undefined) {
        if (lesson.videoLesson) {
          const updateVideoData: any = {};
          if (dto.videoId !== undefined) {
            updateVideoData.videoId = dto.videoId;
          }
          if (dto.embedUrl !== undefined) {
            updateVideoData.embedUrl = dto.embedUrl;
          }
          if (dto.duration !== undefined) {
            updateVideoData.duration = dto.duration;
          }
          await tx.videoLesson.update({
            where: { lessonId: lessonId },
            data: updateVideoData,
          });
        } else if (dto.videoId && dto.embedUrl) {
          await tx.videoLesson.create({
            data: {
              lessonId: lessonId,
              videoId: dto.videoId,
              embedUrl: dto.embedUrl,
              duration: dto.duration,
            },
          });
        }
      }

      const finalUpdated = await tx.lesson.findUnique({
        where: { id: lessonId },
        include: {
          videoLesson: true,
          files: true,
        },
      });

      return finalUpdated || updated;
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

  async getLessonBySlug(lessonSlug: string, teacherId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug, deletedAt: null },
      include: {
        chapter: {
          include: {
            course: {
              select: { id: true, teacherId: true },
            },
          },
        },
        videoLesson: true,
        files: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.chapter.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to view this lesson');
    }

    const response: successResponse = {
      message: 'Get lesson successfully',
      data: lesson,
    };
    return response;
  }
}

