import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CourseDescriptionDto, CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { ChapterTreeItemDto, CreateChapterDto } from './dto/chapter.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { getSystemErrorMap } from 'util';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';
import { CategoryService } from 'src/modules/category/category.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
  ) {}
  
  async getAllCourses(filter: fullObjectFilter) {
    const {courses, total, page, limit} = await this.getCourses(filter);
    const response: successResponse = {
      message: 'Get all courses successfully',
      data: {
        items: courses,
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

  async getCoursesByTeacherId(teacherId: string, filter: fullObjectFilter) {
    const {courses, total, page, limit} = await this.getCourses(filter, teacherId);
    const response: successResponse = {
      message: 'Get all courses by teacher id successfully',
      data: {
        items: courses,
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

  async getMyCourses(teacherId: string, filter: fullObjectFilter) {
    const {courses, total, page, limit} = await this.getCourses(filter, teacherId, true);
    const response: successResponse = {
      message: 'Get my courses successfully',
      data: {
        items: courses,
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

  async createCourse(
    createCourseDto: CreateCourseDto,
    currentUser: currentClientUser,
  ) {
    const { courseDescription, ...courseData } = createCourseDto;

    const category = await this.categoryService.checkExistedCategoryById(
      courseData.categoryId,
    );
    if (!category) throw new BadRequestException('Category is not existed');

    const course = await this.prisma.$transaction(async (tx) => {
      const courseDescriptionData = await tx.courseDescription.create({
        data: {
          ...courseDescription,
          targetKnowledges:
            courseDescription?.targetKnowledges?.join('&&&') || null,
          requirement: courseDescription?.requirement?.join('&&&') || null,
          suitableParticipant:
            courseDescription?.suitableParticipant?.join('&&&') || null,
        },
      });

      const createdCourse = await tx.course.create({
        data: {
          ...courseData,
          slug: generateUniqueSlug(courseData.title),
          teacherId: currentUser.id,
          courseDescriptionId: courseDescriptionData.id,
        },
      });

      return {
        createdCourse,
        courseDescriptionData,
      };
    });

    const response: successResponse = {
      message: 'Create course successfully',
      data: course,
    };
    return response;
  }

  private async getCourses(filter: fullObjectFilter, teacherId?: string, isMyCourses?: boolean){
    const {keySearch, sortField = 'createdAt',sortOrder = 'asc'} = filter;
    const isPublished = (filter as any).isPublished;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    let isPublishedFilter: boolean | undefined = undefined;
    if (isMyCourses && isPublished !== undefined && isPublished !== null && isPublished !== '') {
      const isPublishedStr = String(isPublished).toLowerCase();
      if (isPublishedStr === 'true' || isPublished === true) {
        isPublishedFilter = true;
      } else if (isPublishedStr === 'false' || isPublished === false) {
        isPublishedFilter = false;
      }
    }

    const where: any = {
      deletedAt: null,
      ...(teacherId && { teacherId }),
      ...(keySearch && {
        title: { contains: keySearch, mode: 'insensitive' as const },
      }),
    };

    if (isMyCourses) {
      if (isPublishedFilter !== undefined) {
        where.isPublished = isPublishedFilter;
      }
    } else {
      where.isPublished = true;
    }

    const [total, courses] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        include: {
          teacher: {
            select: { id: true, fullName: true },
          },
          courseDescription: true,
          category: { select: { id: true, title: true, slug: true } },
        },
        ...(sortField && sortOrder && { orderBy: { [sortField]: sortOrder } }),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {courses, total, page, limit};
  }

  async getCourseBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        deletedAt: null,
        isPublished: true,
      },
      include: {
        teacher: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, role: true, emailVerified: true, status: true, country: true },
        },
        courseDescription: true,
        category: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const courseDescription = course.courseDescription
      ? {
          headline: course.courseDescription.headline,
          targetKnowledges: course.courseDescription.targetKnowledges
            ? course.courseDescription.targetKnowledges.split('&&&')
            : [],
          requirement: course.courseDescription.requirement
            ? course.courseDescription.requirement.split('&&&')
            : [],
          suitableParticipant: course.courseDescription.suitableParticipant
            ? course.courseDescription.suitableParticipant.split('&&&')
            : [],
          detail: course.courseDescription.detail,
        }
      : null;

    const response: successResponse = {
      message: 'Get course by slug successfully',
      data: {
        ...course,
        courseDescription: courseDescription,
      },
    };
    return response;
  }

  async getCourseBySlugTeacherArea(slug: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        deletedAt: null,
        teacherId,
      },
      include: {
        teacher: {
          select: { id: true, fullName: true },
        },
        courseDescription: true,
        category: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const courseDescription = course.courseDescription
      ? {
          headline: course.courseDescription.headline,
          targetKnowledges: course.courseDescription.targetKnowledges
            ? course.courseDescription.targetKnowledges.split('&&&')
            : [],
          requirement: course.courseDescription.requirement
            ? course.courseDescription.requirement.split('&&&')
            : [],
          suitableParticipant: course.courseDescription.suitableParticipant
            ? course.courseDescription.suitableParticipant.split('&&&')
            : [],
          detail: course.courseDescription.detail,
        }
      : null;

    const response: successResponse = {
      message: 'Get course successfully',
      data: {
        ...course,
        courseDescription: courseDescription,
      },
    };
    return response;
  }

  async getCourseById(id: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        deletedAt: null,
        teacherId,
      },
      include: {
        teacher: {
          select: { id: true, fullName: true },
        },
        courseDescription: true,
        category: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const courseDescription = course.courseDescription
      ? {
          headline: course.courseDescription.headline,
          targetKnowledges: course.courseDescription.targetKnowledges
            ? course.courseDescription.targetKnowledges.split('&&&')
            : [],
          requirement: course.courseDescription.requirement
            ? course.courseDescription.requirement.split('&&&')
            : [],
          suitableParticipant: course.courseDescription.suitableParticipant
            ? course.courseDescription.suitableParticipant.split('&&&')
            : [],
          detail: course.courseDescription.detail,
        }
      : null;

    const response: successResponse = {
      message: 'Get course successfully',
      data: {
        ...course,
        courseDescription: courseDescription,
      },
    };
    return response;
  }

  async updateCourse(
    id: string,
    updateCourseDto: UpdateCourseDto,
    teacherId: string,
  ) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        deletedAt: null,
        teacherId,
      },
      include: {
        courseDescription: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (updateCourseDto.categoryId) {
      const category = await this.categoryService.checkExistedCategoryById(
        updateCourseDto.categoryId,
      );
      if (!category) {
        throw new BadRequestException('Category is not existed');
      }
    }

    const updatedCourse = await this.prisma.$transaction(async (tx) => {
      let courseDescriptionData = course.courseDescription;

      if (updateCourseDto.courseDescription) {
        const descriptionData = {
          ...(updateCourseDto.courseDescription.headline !== undefined && {
            headline: updateCourseDto.courseDescription.headline,
          }),
          ...(updateCourseDto.courseDescription.targetKnowledges !== undefined && {
            targetKnowledges:
              updateCourseDto.courseDescription.targetKnowledges.length > 0
                ? updateCourseDto.courseDescription.targetKnowledges.join('&&&')
                : null,
          }),
          ...(updateCourseDto.courseDescription.requirement !== undefined && {
            requirement:
              updateCourseDto.courseDescription.requirement.length > 0
                ? updateCourseDto.courseDescription.requirement.join('&&&')
                : null,
          }),
          ...(updateCourseDto.courseDescription.suitableParticipant !== undefined && {
            suitableParticipant:
              updateCourseDto.courseDescription.suitableParticipant.length > 0
                ? updateCourseDto.courseDescription.suitableParticipant.join('&&&')
                : null,
          }),
          ...(updateCourseDto.courseDescription.detail !== undefined && {
            detail: updateCourseDto.courseDescription.detail,
          }),
        };

        courseDescriptionData = await tx.courseDescription.update({
          where: { id: course.courseDescriptionId },
          data: descriptionData,
        });
      }

      const courseData: any = {
        ...(updateCourseDto.title !== undefined && {
          title: updateCourseDto.title,
        }),
        ...(updateCourseDto.thumbnailUrl !== undefined && {
          thumbnailUrl: updateCourseDto.thumbnailUrl,
        }),
        ...(updateCourseDto.price !== undefined && { price: updateCourseDto.price }),
        ...(updateCourseDto.categoryId !== undefined && {
          categoryId: updateCourseDto.categoryId,
        }),
        ...(updateCourseDto.isPublished !== undefined && {
          isPublished: updateCourseDto.isPublished,
        }),
      };

      const updated = await tx.course.update({
        where: { id: course.id },
        data: courseData,
        include: {
          teacher: {
            select: { id: true, fullName: true },
          },
          courseDescription: true,
          category: { select: { id: true, title: true, slug: true } },
        },
      });

      return {
        ...updated,
        courseDescription: {
          headline: courseDescriptionData.headline,
          targetKnowledges: courseDescriptionData.targetKnowledges
            ? courseDescriptionData.targetKnowledges.split('&&&')
            : [],
          requirement: courseDescriptionData.requirement
            ? courseDescriptionData.requirement.split('&&&')
            : [],
          suitableParticipant: courseDescriptionData.suitableParticipant
            ? courseDescriptionData.suitableParticipant.split('&&&')
            : [],
          detail: courseDescriptionData.detail,
        },
      };
    });

    const response: successResponse = {
      message: 'Update course successfully',
      data: updatedCourse,
    };
    return response;
  }

  async getChapterTreeBySlug(slug: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, deletedAt: null, teacherId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const chapters = await this.prisma.chapter.findMany({
      where: { courseId: course.id },
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
      select: { id: true, title: true, slug: true, description: true, position: true, parentId: true },
    });

    const idToNode: Record<string, ChapterTreeItemDto> = {};
    chapters.forEach((ch) => {
      idToNode[ch.id] = {
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        description: ch.description,
        position: ch.position,
        parentId: ch.parentId,
        children: [],
      };
    });

    const roots: ChapterTreeItemDto[] = [];
    chapters.forEach((ch) => {
      const node = idToNode[ch.id];
      if (ch.parentId && idToNode[ch.parentId]) {
        idToNode[ch.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    const response: successResponse = {
      message: 'Get chapter tree successfully',
      data: { items: roots },
    };
    return response;
  }

  async createChapterBySlug(slug: string, dto: CreateChapterDto, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, deletedAt: null, teacherId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (dto.parentId) {
      const parent = await this.prisma.chapter.findFirst({
        where: { id: dto.parentId, courseId: course.id },
        select: { id: true },
      });
      if (!parent) throw new BadRequestException('Parent chapter not found');
    }

    const maxPos = await this.prisma.chapter.aggregate({
      where: { courseId: course.id, parentId: dto.parentId ?? null },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max?.position ?? 0) + 1;

    const created = await this.prisma.chapter.create({
      data: {
        courseId: course.id,
        title: dto.title,
        slug: generateUniqueSlug(dto.title),
        description: dto.description,
        parentId: dto.parentId ?? null,
        position: nextPosition,
      },
      select: { id: true, title: true, slug: true, description: true, position: true, parentId: true },
    });

    const response: successResponse = {
      message: 'Create chapter successfully',
      data: created,
    };
    return response;
  }

  async getChapterTree(id: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null, teacherId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const chapters = await this.prisma.chapter.findMany({
      where: { courseId: course.id },
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
      select: { id: true, title: true, slug: true, description: true, position: true, parentId: true },
    });

    const idToNode: Record<string, ChapterTreeItemDto> = {};
    chapters.forEach((ch) => {
      idToNode[ch.id] = {
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        description: ch.description,
        position: ch.position,
        parentId: ch.parentId,
        children: [],
      };
    });

    const roots: ChapterTreeItemDto[] = [];
    chapters.forEach((ch) => {
      const node = idToNode[ch.id];
      if (ch.parentId && idToNode[ch.parentId]) {
        idToNode[ch.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    const response: successResponse = {
      message: 'Get chapter tree successfully',
      data: { items: roots },
    };
    return response;
  }

  async createChapter(id: string, dto: CreateChapterDto, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null, teacherId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (dto.parentId) {
      const parent = await this.prisma.chapter.findFirst({
        where: { id: dto.parentId, courseId: course.id },
        select: { id: true },
      });
      if (!parent) throw new BadRequestException('Parent chapter not found');
    }

    const maxPos = await this.prisma.chapter.aggregate({
      where: { courseId: course.id, parentId: dto.parentId ?? null },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max?.position ?? 0) + 1;

    const created = await this.prisma.chapter.create({
      data: {
        courseId: course.id,
        title: dto.title,
        slug: generateUniqueSlug(dto.title),
        description: dto.description,
        parentId: dto.parentId ?? null,
        position: nextPosition,
      },
      select: { id: true, title: true, slug: true, description: true, position: true, parentId: true },
    });

    const response: successResponse = {
      message: 'Create chapter successfully',
      data: created,
    };
    return response;
  }

  async deleteChapterBySlug(slug: string, chapterId: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, deletedAt: null, teacherId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, courseId: course.id },
      include: {
        course: {
          select: { teacherId: true },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (chapter.course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to delete this chapter');
    }

    await this.prisma.chapter.delete({
      where: { id: chapterId },
    });

    const response: successResponse = {
      message: 'Delete chapter successfully',
    };
    return response;
  }

  async deleteChapter(courseId: string, chapterId: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null, teacherId },
      select: { id: true, teacherId: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const chapter = await this.prisma.chapter.findFirst({
      where: { id: chapterId, courseId: course.id },
    });

    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have permission to delete this chapter');
    }

    await this.prisma.chapter.delete({
      where: { id: chapterId },
    });

    const response: successResponse = {
      message: 'Delete chapter successfully',
    };
    return response;
  }

  async deleteCourse(id: string, teacherId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        deletedAt: null,
        teacherId,
      },
      select: {
        id: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const response: successResponse = {
      message: 'Delete course successfully',
    };
    return response;
  }
}
