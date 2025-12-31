import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/redis/redis.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class OnlineStatusService {
  private readonly ONLINE_TTL = 60;

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  private getUserOnlineKey(userId: string): string {
    return `user:online:${userId}`;
  }

  async setUserOnline(userId: string): Promise<void> {
    await this.redis.set(this.getUserOnlineKey(userId), '1', this.ONLINE_TTL);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.redis.get(this.getUserOnlineKey(userId));
    return result === '1';
  }

  async getUsersOnlineStatus(
    userIds: string[],
  ): Promise<Record<string, { isOnline: boolean; lastLoginAt: Date | null }>> {
    if (userIds.length === 0) {
      return {};
    }

    const keys = userIds.map((userId) => this.getUserOnlineKey(userId));
    const [redisResults, users] = await Promise.all([
      this.redis.mget(keys),
      this.prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          lastLoginAt: true,
        },
      }),
    ]);

    const userMap = new Map(users.map((user) => [user.id, user.lastLoginAt]));

    const statusMap: Record<
      string,
      { isOnline: boolean; lastLoginAt: Date | null }
    > = {};
    userIds.forEach((userId, index) => {
      statusMap[userId] = {
        isOnline: redisResults[index] === '1',
        lastLoginAt: userMap.get(userId) || null,
      };
    });

    return statusMap;
  }
}
