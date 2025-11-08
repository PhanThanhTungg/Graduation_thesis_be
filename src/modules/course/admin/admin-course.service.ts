import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';

@Injectable()
export class AdminCourseService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCourses(filter: fullObjectFilter) {
    const { keySearch, sortField = 'createdAt', sortOrder = 'desc' } = filter;
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;

    const where = {
      deletedAt: null,
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
            select: { 
              id: true, 
              fullName: true,
            },
          },
          category: { 
            select: { 
              id: true, 
              title: true,
            } 
          },
        },
        ...(sortField && sortOrder && { orderBy: { [sortField]: sortOrder } }),
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Transform data to match desired format
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price,
      countStudent: course.countStudent,
      isPublished: course.isPublished,
      teacher: {
        id: course.teacher.id,
        name: course.teacher.fullName,
      },
      category: course.category ? {
        id: course.category.id,
        name: course.category.title,
      } : null,
      createdAt: course.createdAt,
    }));

    const response: successResponse = {
      message: 'Get all courses successfully',
      data: {
        items: formattedCourses,
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
}
