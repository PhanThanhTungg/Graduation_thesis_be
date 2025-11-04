import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CourseDescriptionDto, CreateCourseDto } from './dto/course.dto';
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
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    const where = {
      deletedAt: null,
      isPublished: isMyCourses ? undefined : true,
      ...(teacherId && { teacherId }),
      ...(keySearch && {
        title: { contains: keySearch, mode: 'insensitive' as const },
      }),
    };

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
}
