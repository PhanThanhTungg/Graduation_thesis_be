import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  CourseDescriptionDto,
  CreateCourseDto,
  UpdateCourseDto,
} from './dto/course.dto';
import {
  ChapterTreeItemDto,
  CreateChapterDto,
  UpdateChapterDto,
} from './dto/chapter.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
import { generateUniqueSlug } from 'src/common/utils/slug.util';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import { getSystemErrorMap } from 'util';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';
import { CategoryService } from 'src/modules/category/category.service';
import { OrderStatus, ConversationMemberRole } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
  ) {}

  async getUserWishList(userId: string) {
    const wishlist = await this.prisma.wishList.findMany({
      where: {
        userId,
        deletedAt: null,
        course: {
          deletedAt: null,
          isPublished: true,
        },
      },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, fullName: true } },
            category: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    const data = wishlist.map((item) => {
      const course = item.course;
      return {
        ...course,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    const response: successResponse = {
      message: 'Get wishlist successfully',
      data: { items: data },
    };
    return response;
  }

  async addToWishList(userId: string, courseId: string) {
    try {
      const upserted = await this.prisma.wishList.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: { deletedAt: null },
        create: { userId, courseId },
      });

      const response: successResponse = {
        message: 'Add to wishlist successfully',
      };
      return response;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Foreign key constraint failed — course not found
        if (error.code === 'P2003') {
          throw new NotFoundException('Course not found');
        }
      }
      throw error;
    }
  }

  async removeFromWishList(userId: string, courseId: string) {
    try {
      const updated = await this.prisma.wishList.update({
        where: { userId_courseId: { userId, courseId } },
        data: { deletedAt: new Date() },
      });

      const response: successResponse = {
        message: 'Remove from wishlist successfully',
      };
      return response;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Wishlist item not found');
        }
      }
      throw error;
    }
  }

  async getAllCoursesWithFilters(dto: GetCoursesDto) {
    const {
      categoryIds,
      ratings,
      priceFrom,
      priceTo,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;

    // Build where clause
    const where: any = {
      deletedAt: null,
      isPublished: true,
    };

    // Filter by categories
    if (categoryIds) {
      const categoryIdArray = categoryIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');

      if (categoryIdArray.length > 0) {
        where.categoryId = { in: categoryIdArray };
      }
    }

    // Filter by ratings (using the rating field in Course model)
    if (ratings) {
      const ratingArray = ratings
        .split(',')
        .map((r) => parseFloat(r.trim()))
        .filter((r) => !isNaN(r) && r >= 1 && r <= 5);

      if (ratingArray.length > 0) {
        // Build rating conditions for OR query
        const ratingConditions = ratingArray.map((rating) => {
          if (rating === 5) {
            return { rating: { gte: 5, lte: 5 } };
          }
          return { rating: { gte: rating, lt: rating + 1 } };
        });

        // If we already have OR conditions from search, merge them
        if (where.OR) {
          where.AND = [{ OR: where.OR }, { OR: ratingConditions }];
          delete where.OR;
        } else {
          where.OR = ratingConditions;
        }
      }
    }

    // Filter by price range
    if (priceFrom !== undefined && priceTo !== undefined) {
      where.price = { gte: priceFrom, lte: priceTo };
    } else if (priceFrom !== undefined) {
      where.price = { gte: priceFrom };
    } else if (priceTo !== undefined) {
      where.price = { lte: priceTo };
    }

    // Search by title or description (handle conflicts with rating OR)
    if (search) {
      const searchConditions = [
        { title: { contains: search, mode: 'insensitive' as const } },
        {
          courseDescription: {
            detail: { contains: search, mode: 'insensitive' as const },
          },
        },
      ];

      if (where.OR && !where.AND) {
        // Already has OR from ratings
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else if (where.AND) {
        // Already has AND, just add search OR
        where.AND.push({ OR: searchConditions });
      } else {
        // No OR/AND yet, just set OR
        where.OR = searchConditions;
      }
    }

    // Count total
    const total = await this.prisma.course.count({ where });

    // Build orderBy
    const validSortFields = ['createdAt', 'price', 'rating', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy: any = { [sortField]: sortOrder.toLowerCase() };

    // Get courses with pagination
    const courses = await this.prisma.course.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
          },
        },
        category: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response
    const totalPages = Math.ceil(total / limit);

    const response: successResponse = {
      message: 'Get courses with filters successfully',
      data: {
        items: courses,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    };

    return response;
  }

  async getCoursesByTeacherId(teacherId: string, filter: fullObjectFilter) {
    const { courses, total, page, limit } = await this.getCourses(
      filter,
      teacherId,
    );
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
    const { courses, total, page, limit } = await this.getCourses(
      filter,
      teacherId,
      true,
    );
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

      const conversation = await tx.conversation.create({
        data: {
          name:
            courseData.title.length > 50
              ? courseData.title.substring(0, 47) + '...'
              : courseData.title,
          isGroup: true,
          members: {
            create: {
              userId: currentUser.id,
              role: ConversationMemberRole.admin,
            },
          },
        },
      });

      const createdCourse = await tx.course.create({
        data: {
          ...courseData,
          slug: generateUniqueSlug(courseData.title),
          teacherId: currentUser.id,
          courseDescriptionId: courseDescriptionData.id,
          conversationId: conversation.id,
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

  private async getCourses(
    filter: fullObjectFilter,
    teacherId?: string,
    isMyCourses?: boolean,
  ) {
    const { keySearch, sortField = 'createdAt', sortOrder = 'asc' } = filter;
    const isPublished = (filter as any).isPublished;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    let isPublishedFilter: boolean | undefined = undefined;
    if (
      isMyCourses &&
      isPublished !== undefined &&
      isPublished !== null &&
      isPublished !== ''
    ) {
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

    return { courses, total, page, limit };
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
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
            emailVerified: true,
            status: true,
            country: true,
          },
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
          ...(updateCourseDto.courseDescription.targetKnowledges !==
            undefined && {
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
          ...(updateCourseDto.courseDescription.suitableParticipant !==
            undefined && {
            suitableParticipant:
              updateCourseDto.courseDescription.suitableParticipant.length > 0
                ? updateCourseDto.courseDescription.suitableParticipant.join(
                    '&&&',
                  )
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
        ...(updateCourseDto.price !== undefined && {
          price: updateCourseDto.price,
        }),
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
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        position: true,
        parentId: true,
      },
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

  async createChapterBySlug(
    slug: string,
    dto: CreateChapterDto,
    teacherId: string,
  ) {
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
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        position: true,
        parentId: true,
      },
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
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        position: true,
        parentId: true,
      },
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
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        position: true,
        parentId: true,
      },
    });

    const response: successResponse = {
      message: 'Create chapter successfully',
      data: created,
    };
    return response;
  }

  async updateChapter(
    courseId: string,
    chapterId: string,
    dto: UpdateChapterDto,
    teacherId: string,
  ) {
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
      throw new ForbiddenException(
        'You do not have permission to update this chapter',
      );
    }

    const updateData: any = {};
    if (dto.title !== undefined) {
      updateData.title = dto.title;
      updateData.slug = generateUniqueSlug(dto.title);
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    const updated = await this.prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        position: true,
        parentId: true,
      },
    });

    const response: successResponse = {
      message: 'Update chapter successfully',
      data: updated,
    };
    return response;
  }

  async deleteChapterBySlug(
    slug: string,
    chapterId: string,
    teacherId: string,
  ) {
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
      throw new ForbiddenException(
        'You do not have permission to delete this chapter',
      );
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
      throw new ForbiddenException(
        'You do not have permission to delete this chapter',
      );
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

  async getMyLearning(studentId: string, filter: fullObjectFilter) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;
    const keySearch = filter.keySearch;

    const where: any = {
      userId: studentId,
      status: OrderStatus.success,
      course: {
        deletedAt: null,
        ...(keySearch && {
          title: { contains: keySearch, mode: 'insensitive' as const },
        }),
      },
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          course: {
            include: {
              teacher: {
                select: { id: true, fullName: true },
              },
              courseDescription: true,
              category: { select: { id: true, title: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const courses = await Promise.all(
      orders.map(async (order) => {
        const course = order.course;
        const courseDescription = course.courseDescription
          ? {
              headline: course.courseDescription.headline || null,
              targetKnowledges:
                course.courseDescription.targetKnowledges || null,
              requirement: course.courseDescription.requirement || null,
              suitableParticipant:
                course.courseDescription.suitableParticipant || null,
              detail: course.courseDescription.detail || null,
            }
          : null;

        const totalLessons = await this.prisma.lesson.count({
          where: {
            chapter: {
              courseId: course.id,
            },
          },
        });

        const completedLessons = await this.prisma.userLessonProgress.count({
          where: {
            userId: studentId,
            progress: 'completed',
            lesson: {
              chapter: {
                courseId: course.id,
              },
            },
          },
        });

        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        return {
          id: course.id,
          title: course.title,
          thumbnailUrl: course.thumbnailUrl,
          price: course.price,
          originalPrice: course.price,
          finalPrice: order.finalPrice,
          discountAmount: order.discountAmount,
          teacher: {
            id: course.teacher.id,
            fullName: course.teacher.fullName,
          },
          courseDescription,
          category: {
            id: course.category.id,
            title: course.category.title,
            slug: course.category.slug || null,
          },
          rating: course.rating,
          slug: course.slug,
          isPublished: course.isPublished,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
          countStudent: course.countStudent,
          purchasedAt: order.completedAt || order.createdAt,
          progress: {
            completedLessons,
            totalLessons,
            percentage: progressPercentage,
          },
        };
      }),
    );

    const response: successResponse = {
      message: 'Get my learning courses successfully',
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

  async getMyGroups(currentUser: currentClientUser) {
    const groups = await this.prisma.conversation.findMany({
      where: {
        isGroup: true,
        members: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const transformedGroups = groups.map((group) => {
      const currentUserMember = group.members.find(
        (m) => m.userId === currentUser.id,
      );
      const lastMessage = group.messages[0];

      const groupData: any = {
        id: group.id,
        name: group.name || 'Group',
        isGroup: true,
        role: currentUserMember?.role || 'member',
        memberCount: group.members.length,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };

      if (group.course) {
        groupData.course = {
          id: group.course.id,
          title: group.course.title,
          slug: group.course.slug,
          thumbnailUrl: group.course.thumbnailUrl,
        };
      }

      if (lastMessage) {
        groupData.lastMessage = {
          id: lastMessage.id,
          message: lastMessage.message,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.fullName,
          createdAt: lastMessage.createdAt,
        };
      }

      return groupData;
    });

    const response: successResponse = {
      message: 'Get groups successfully',
      data: transformedGroups,
    };

    return response;
  }
}
