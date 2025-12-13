import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  CreateLessonDto,
  LessonDto,
  UpdateLessonDto,
  ChapterWithLessonsTreeItemDto,
  LessonTreeItemDto,
} from './dto/lesson.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { successResponse } from 'src/common/interfaces/response.interface';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';
import { LessonProgress } from '@prisma/client';

@Injectable()
export class LessonService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessonBySlugForStudent(lessonSlug: string, userId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                isPublished: true,
                deletedAt: true,
              },
            },
          },
        },
        videoLesson: {
          select: {
            id: true,
            videoId: true,
            embedUrl: true,
            duration: true,
          },
        },
        files: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
          },
        },
        userProgress: {
          where: { userId },
          select: {
            id: true,
            progress: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (!lesson.chapter.course.isPublished || lesson.chapter.course.deletedAt) {
      throw new NotFoundException('Course not found or not published');
    }

    await this.prisma.lesson.update({
      where: { id: lesson.id },
      data: { viewCount: { increment: 1 } },
    });

    const response: successResponse = {
      message: 'Get lesson successfully',
      data: {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        position: lesson.position,
        isFree: lesson.isFree,
        viewCount: lesson.viewCount + 1,
        videoLesson: lesson.videoLesson,
        files: lesson.files,
        progress:
          lesson.userProgress?.[0]?.progress || LessonProgress.not_started,
        chapter: {
          id: lesson.chapter.id,
          title: lesson.chapter.title,
          slug: lesson.chapter.slug,
          course: {
            id: lesson.chapter.course.id,
            slug: lesson.chapter.course.slug,
            title: lesson.chapter.course.title,
          },
        },
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      },
    };
    return response;
  }

  async getNextLessonByCourseSlug(courseSlug: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug: courseSlug, deletedAt: null, isPublished: true },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { courseId: course.id },
      orderBy: { position: 'asc' },
      include: {
        lessons: {
          orderBy: { position: 'asc' },
          include: {
            userProgress: {
              where: { userId },
              select: { id: true, progress: true },
            },
          },
        },
      },
    });

    if (!chapters || chapters.length === 0) {
      throw new NotFoundException('No chapters found in this course');
    }

    let inProgressLesson: {
      id: string;
      slug: string;
      userProgress: { id: string; progress: LessonProgress }[];
    } | null = null;
    let firstNotStartedLesson: {
      id: string;
      slug: string;
      userProgress: { id: string; progress: LessonProgress }[];
    } | null = null;
    let firstLesson: {
      id: string;
      slug: string;
      userProgress: { id: string; progress: LessonProgress }[];
    } | null = null;

    for (const chapter of chapters) {
      if (!chapter.lessons || chapter.lessons.length === 0) {
        continue;
      }

      for (const lesson of chapter.lessons) {
        if (!firstLesson) {
          firstLesson = lesson;
        }

        const userProgressRecord = lesson.userProgress?.[0];
        const progress = userProgressRecord?.progress;

        if (progress === 'in_progress') {
          inProgressLesson = lesson;
          break;
        } else if (!userProgressRecord || progress === 'not_started') {
          if (!firstNotStartedLesson) {
            firstNotStartedLesson = lesson;
          }
        }
      }

      if (inProgressLesson) {
        break;
      }
    }

    const targetLesson =
      inProgressLesson || firstNotStartedLesson || firstLesson;
    if (!targetLesson) {
      throw new NotFoundException('No lessons found in this course');
    }

    const targetProgressRecord = targetLesson.userProgress?.[0];
    const targetProgress = targetProgressRecord?.progress;

    if (!targetProgressRecord || targetProgress === 'not_started') {
      if (targetProgressRecord) {
        await this.prisma.userLessonProgress.update({
          where: { id: targetProgressRecord.id },
          data: { progress: LessonProgress.in_progress },
        });
      } else {
        await this.prisma.userLessonProgress.create({
          data: {
            userId,
            lessonId: targetLesson.id,
            progress: LessonProgress.in_progress,
          },
        });
      }
    }

    const response: successResponse = {
      message: 'Get next lesson successfully',
      data: {
        lessonSlug: targetLesson.slug,
      },
    };
    return response;
  }

  async createLesson(
    chapterId: string,
    dto: CreateLessonDto,
    teacherId: string,
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId },
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
      throw new ForbiddenException(
        'You do not have permission to create lesson in this chapter',
      );
    }

    const maxPos = await this.prisma.lesson.aggregate({
      where: { chapterId: chapter.id },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max?.position ?? 0) + 1;

    const lesson = await this.prisma.$transaction(async (tx) => {
      const createdLesson = await tx.lesson.create({
        data: {
          chapterId: chapter.id,
          title: dto.title,
          slug: generateUniqueSlug(dto.title),
          description: dto.description,
          position: nextPosition,
          isFree: dto.isFree ?? false,
          isGenQues: dto.isGenQues ?? false,
          isGenQuiz: dto.isGenQuiz ?? false,
          promptForGenQues: dto.promptForGenQues,
          promptForGenQuiz: dto.promptForGenQuiz,
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
            isForAiQues: file.isForAiQues ?? false,
            isForAiQuiz: file.isForAiQuiz ?? false,
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

  async getLessonsByChapterId(
    chapterId: string,
    teacherId: string,
    filter: fullObjectFilter = {},
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId },
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
      throw new ForbiddenException(
        'You do not have permission to view lessons in this chapter',
      );
    }

    const { keySearch, sortField = 'position', sortOrder = 'asc' } = filter;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    const where = {
      chapterId: chapter.id,
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

  async getLessonChapterTree(courseSlug: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug: courseSlug, deletedAt: null, isPublished: true },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const chapters = await this.prisma.chapter.findMany({
      where: { courseId: course.id },
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
      include: {
        lessons: {
          orderBy: { position: 'asc' },
          include: {
            videoLesson: {
              select: {
                videoId: true,
                embedUrl: true,
                duration: true,
              },
            },
            userProgress: {
              where: { userId },
              select: { progress: true },
            },
            reviewSetting: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!chapters || chapters.length === 0) {
      throw new NotFoundException('No chapters found in this course');
    }

    const idToNode: Record<string, ChapterWithLessonsTreeItemDto> = {};
    chapters.forEach((ch) => {
      const lessons: LessonTreeItemDto[] = ch.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        position: lesson.position,
        isFree: lesson.isFree,
        viewCount: lesson.viewCount,
        videoLesson: lesson.videoLesson,
        progress:
          lesson.userProgress?.[0]?.progress || LessonProgress.not_started,
        isInReviewSpace: !!lesson.reviewSetting,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
      }));

      idToNode[ch.id] = {
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        description: ch.description,
        position: ch.position,
        parentId: ch.parentId,
        lessons,
        children: [],
      };
    });

    const roots: ChapterWithLessonsTreeItemDto[] = [];
    chapters.forEach((ch) => {
      const node = idToNode[ch.id];
      if (ch.parentId && idToNode[ch.parentId]) {
        idToNode[ch.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    const response: successResponse = {
      message: 'Get lesson chapter tree successfully',
      data: { items: roots },
    };
    return response;
  }

  async updateLesson(
    lessonId: string,
    dto: UpdateLessonDto,
    teacherId: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId },
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
      throw new ForbiddenException(
        'You do not have permission to update this lesson',
      );
    }

    const updatedLesson = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (dto.title !== undefined) {
        updateData.title = dto.title;
      }

      if (dto.description !== undefined) {
        updateData.description = dto.description;
      }

      if (dto.isFree !== undefined) {
        updateData.isFree = dto.isFree;
      }

      if (dto.isGenQues !== undefined) {
        updateData.isGenQues = dto.isGenQues;
      }

      if (dto.isGenQuiz !== undefined) {
        updateData.isGenQuiz = dto.isGenQuiz;
      }

      if (dto.promptForGenQues !== undefined) {
        updateData.promptForGenQues = dto.promptForGenQues;
      }

      if (dto.promptForGenQuiz !== undefined) {
        updateData.promptForGenQuiz = dto.promptForGenQuiz;
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

      if (dto.files !== undefined) {
        await tx.file.deleteMany({
          where: { lessonId: lessonId },
        });

        if (dto.files.length > 0) {
          await tx.file.createMany({
            data: dto.files.map((file) => ({
              lessonId: lessonId,
              fileUrl: file.fileUrl,
              fileName: file.fileName,
              fileSize: file.fileSize,
              isForAiQues: file.isForAiQues ?? false,
              isForAiQuiz: file.isForAiQuiz ?? false,
            })),
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
      where: { id: lessonId },
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
      throw new ForbiddenException(
        'You do not have permission to delete this lesson',
      );
    }

    await this.prisma.lesson.delete({
      where: { id: lessonId },
    });

    const response: successResponse = {
      message: 'Delete lesson successfully',
    };
    return response;
  }

  async getLessonBySlug(lessonSlug: string, teacherId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
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
      throw new ForbiddenException(
        'You do not have permission to view this lesson',
      );
    }

    const response: successResponse = {
      message: 'Get lesson successfully',
      data: lesson,
    };
    return response;
  }

  async pingStatusLesson(
    lessonSlug: string,
    progress: LessonProgress,
    userId: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug: lessonSlug },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                id: true,
                isPublished: true,
                deletedAt: true,
              },
            },
          },
        },
        userProgress: {
          where: { userId },
          select: {
            id: true,
            progress: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (!lesson.chapter.course.isPublished || lesson.chapter.course.deletedAt) {
      throw new NotFoundException('Course not found or not published');
    }

    const existingProgress = lesson.userProgress?.[0];

    if (existingProgress) {
      await this.prisma.userLessonProgress.update({
        where: { id: existingProgress.id },
        data: { progress },
      });

      const response: successResponse = {
        message: 'Lesson status updated successfully',
        data: { progress },
      };
      return response;
    } else {
      await this.prisma.userLessonProgress.create({
        data: {
          userId,
          lessonId: lesson.id,
          progress,
        },
      });

      const response: successResponse = {
        message: 'Lesson status updated successfully',
        data: { progress },
      };
      return response;
    }
  }

  async getLessonById(lessonId: string) {
    return await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });
  }
}
