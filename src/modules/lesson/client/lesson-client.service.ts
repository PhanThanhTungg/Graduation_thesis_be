import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CreateLessonDto, LessonDto } from './dto/lesson.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { successResponse } from 'src/common/interfaces/response.interface';

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

  async getLessonsByChapterId(chapterId: string, teacherId: string) {
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

    const lessons = await this.prisma.lesson.findMany({
      where: { chapterId: chapter.id, deletedAt: null },
      orderBy: { position: 'asc' },
      include: {
        videoLesson: true,
        theoryFile: true,
        exerciseFile: true,
      },
    });

    const response: successResponse = {
      message: 'Get lessons successfully',
      data: { items: lessons },
    };
    return response;
  }
}

