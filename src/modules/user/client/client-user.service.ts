import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class ClientUserService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(
    keySearch: string,
    currentUserId?: string,
    limit: number = 20,
  ): Promise<successResponse> {
    if (!keySearch || keySearch.trim().length === 0) {
      return {
        message: 'Search query is required',
        data: [],
      };
    }

    const where: any = {
      deletedAt: null,
      status: 'active',
    };

    if (keySearch) {
      where.fullName = {
        contains: keySearch.trim(),
        mode: 'insensitive',
      };
    }

    if (currentUserId) {
      where.NOT = {
        id: currentUserId,
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
      },
      take: limit,
      orderBy: {
        fullName: 'asc',
      },
    });

    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.fullName,
      avatar: user.avatarUrl,
      role: user.role,
    }));

    return {
      message: 'Search users successfully',
      data: transformedUsers,
    };
  }
}
