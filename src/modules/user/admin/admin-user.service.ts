import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { UserRole } from 'src/common/enums/common.enum';
import { Status } from '@prisma/client';

interface GetAllUsersParams {
  keySearch?: string;
  role?: UserRole;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(params: GetAllUsersParams): Promise<successResponse> {
    const {
      keySearch,
      role,
      sortField = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = params;

    const where: any = {
      deletedAt: null,
    };

    if (keySearch) {
      where.OR = [
        { fullName: { contains: keySearch, mode: 'insensitive' } },
        { email: { contains: keySearch, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          emailVerified: true,
          avatarUrl: true,
          status: true,
          country: true,
          createdAt: true,
        },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      status: user.status,
      country: user.country,
      createdAt: user.createdAt,
    }));

    const response: successResponse = {
      message: 'Get all users successfully',
      data: {
        items: transformedUsers,
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

  async getUserById(userId: string): Promise<successResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        status: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        teacherSetting: {
          select: {
            id: true,
            bio: true,
            headline: true,
            website: true,
            facebook: true,
            linkedin: true,
            youtube: true,
          },
        },
        courses: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            price: true,
            countStudent: true,
            isPublished: true,
            slug: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        message: 'User not found',
        data: null,
      };
    }

    const transformedUser: any = {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      status: user.status,
      country: user.country,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    if (user.role === UserRole.teacher) {
      transformedUser.teacherSettings = user.teacherSetting
        ? {
            id: user.teacherSetting.id,
            bio: user.teacherSetting.bio,
            headline: user.teacherSetting.headline,
            website: user.teacherSetting.website,
            facebook: user.teacherSetting.facebook,
            linkedin: user.teacherSetting.linkedin,
            youtube: user.teacherSetting.youtube,
          }
        : null;

      transformedUser.courses = user.courses.map((course) => ({
        id: course.id,
        title: course.title,
        thumbnailUrl: course.thumbnailUrl,
        price: course.price,
        countStudent: course.countStudent,
        isPublished: course.isPublished,
        slug: course.slug,
        category: course.category
          ? {
              id: course.category.id,
              name: course.category.title,
            }
          : null,
        createdAt: course.createdAt,
      }));
    }

    const response: successResponse = {
      message: 'Get user detail successfully',
      data: transformedUser,
    };

    return response;
  }

  async updateUserStatus(userId: string, status: Status): Promise<successResponse> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    const response: successResponse = {
      message: 'Update user status successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt,
      },
    };

    return response;
  }
}