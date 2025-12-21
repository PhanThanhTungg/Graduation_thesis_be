import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SocketGateway } from '../../socket/socket.gateway';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class FriendsClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async searchFriends(
    keySearch: string,
    currentUserId: string,
    limit: number = 50,
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
      NOT: {
        id: currentUserId,
      },
    };

    if (keySearch) {
      where.fullName = {
        contains: keySearch.trim(),
        mode: 'insensitive',
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

    const userIds = users.map((user) => user.id);

    const friends = await this.prisma.friend.findMany({
      where: {
        userId: currentUserId,
        friendId: {
          in: userIds,
        },
      },
      select: {
        friendId: true,
        status: true,
      },
    });

    const friendStatusMap = new Map<string, string>();
    friends.forEach((friend) => {
      friendStatusMap.set(friend.friendId, friend.status);
    });

    const reverseFriends = await this.prisma.friend.findMany({
      where: {
        friendId: currentUserId,
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
        status: true,
      },
    });

    reverseFriends.forEach((friend) => {
      const existingStatus = friendStatusMap.get(friend.userId);
      if (!existingStatus) {
        friendStatusMap.set(friend.userId, friend.status);
      }
    });

    const transformedUsers = users.map((user) => ({
      id: user.id,
      name: user.fullName,
      avatar: user.avatarUrl,
      role: user.role,
      friendStatus: friendStatusMap.get(user.id) || null,
    }));

    return {
      message: 'Search friends successfully',
      data: transformedUsers,
    };
  }

  async addFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<successResponse> {
    if (userId === friendId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const friend = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, fullName: true, avatarUrl: true },
    });

    if (!friend) {
      throw new BadRequestException('User not found');
    }

    const existingFriend = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (existingFriend) {
      throw new BadRequestException('Friend request already exists');
    }

    const reverseFriend = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
    });

    if (reverseFriend) {
      throw new BadRequestException('Friend request already exists');
    }

    const newFriend = await this.prisma.friend.create({
      data: {
        userId,
        friendId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.socketGateway.emitToRoom(`user:${friendId}`, 'newFriendRequest', {
      id: newFriend.userId,
      friendId: newFriend.friendId,
      sender: {
        id: newFriend.user.id,
        name: newFriend.user.fullName,
        avatar: newFriend.user.avatarUrl,
      },
      createdAt: newFriend.createdAt.toISOString(),
    });

    return {
      message: 'Friend request sent successfully',
      data: {
        userId: newFriend.userId,
        friendId: newFriend.friendId,
        status: newFriend.status,
      },
    };
  }

  async getFriendRequests(userId: string): Promise<successResponse> {
    const friendRequests = await this.prisma.friend.findMany({
      where: {
        friendId: userId,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedRequests = friendRequests.map((request) => ({
      id: request.userId,
      friendId: request.friendId,
      sender: {
        id: request.user.id,
        name: request.user.fullName,
        avatar: request.user.avatarUrl,
        role: request.user.role,
      },
      createdAt: request.createdAt.toISOString(),
    }));

    return {
      message: 'Get friend requests successfully',
      data: transformedRequests,
    };
  }

  async getSentFriendRequests(userId: string): Promise<successResponse> {
    const sentRequests = await this.prisma.friend.findMany({
      where: {
        userId: userId,
        status: 'pending',
      },
      include: {
        friend: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedRequests = sentRequests.map((request) => ({
      id: request.userId,
      friendId: request.friendId,
      recipient: {
        id: request.friend.id,
        name: request.friend.fullName,
        avatar: request.friend.avatarUrl,
        role: request.friend.role,
      },
      createdAt: request.createdAt.toISOString(),
    }));

    return {
      message: 'Get sent friend requests successfully',
      data: transformedRequests,
    };
  }

  async getAcceptedFriends(userId: string): Promise<successResponse> {
    const friendsAsUser = await this.prisma.friend.findMany({
      where: {
        userId: userId,
        status: 'accepted',
      },
      include: {
        friend: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });

    const friendsAsFriend = await this.prisma.friend.findMany({
      where: {
        friendId: userId,
        status: 'accepted',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: {
        acceptedAt: 'desc',
      },
    });

    const friendsMap = new Map();

    friendsAsUser.forEach((f) => {
      friendsMap.set(f.friend.id, {
        id: f.friend.id,
        name: f.friend.fullName,
        avatar: f.friend.avatarUrl,
        role: f.friend.role,
        acceptedAt: f.acceptedAt?.toISOString() || f.createdAt.toISOString(),
      });
    });

    friendsAsFriend.forEach((f) => {
      if (!friendsMap.has(f.user.id)) {
        friendsMap.set(f.user.id, {
          id: f.user.id,
          name: f.user.fullName,
          avatar: f.user.avatarUrl,
          role: f.user.role,
          acceptedAt: f.acceptedAt?.toISOString() || f.createdAt.toISOString(),
        });
      }
    });

    const friends = Array.from(friendsMap.values()).sort(
      (a, b) =>
        new Date(b.acceptedAt).getTime() - new Date(a.acceptedAt).getTime(),
    );

    return {
      message: 'Get accepted friends successfully',
      data: friends,
    };
  }

  async cancelFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<successResponse> {
    const friendRequest = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found');
    }

    if (friendRequest.status !== 'pending') {
      throw new BadRequestException('Can only cancel pending friend requests');
    }

    await this.prisma.friend.delete({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    this.socketGateway.emitToRoom(
      `user:${friendId}`,
      'friendRequestCancelled',
      {
        userId,
        friendId,
      },
    );

    return {
      message: 'Friend request cancelled successfully',
      data: {
        userId,
        friendId,
      },
    };
  }

  async acceptFriendRequest(
    userId: string,
    friendId: string,
  ): Promise<successResponse> {
    const friendRequest = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!friendRequest) {
      throw new BadRequestException('Friend request not found');
    }

    if (friendRequest.status !== 'pending') {
      throw new BadRequestException('Friend request is not pending');
    }

    const updatedFriend = await this.prisma.friend.update({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        role: true,
      },
    });

    this.socketGateway.emitToRoom(`user:${friendId}`, 'friendRequestAccepted', {
      userId,
      friendId,
      friend: {
        id: currentUser?.id || '',
        name: currentUser?.fullName || '',
        avatar: currentUser?.avatarUrl,
        role: currentUser?.role || 'student',
      },
    });

    this.socketGateway.emitToRoom(`user:${userId}`, 'friendRequestAccepted', {
      userId: friendId,
      friendId: userId,
      friend: {
        id: friendRequest.user.id,
        name: friendRequest.user.fullName,
        avatar: friendRequest.user.avatarUrl,
        role: friendRequest.user.role,
      },
    });

    return {
      message: 'Friend request accepted successfully',
      data: {
        userId: updatedFriend.userId,
        friendId: updatedFriend.friendId,
        status: updatedFriend.status,
        acceptedAt: updatedFriend.acceptedAt?.toISOString(),
      },
    };
  }

  async unfriend(userId: string, friendId: string): Promise<successResponse> {
    const friendAsUser = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId,
          friendId,
        },
      },
    });

    const friendAsFriend = await this.prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: friendId,
          friendId: userId,
        },
      },
    });

    if (!friendAsUser && !friendAsFriend) {
      throw new BadRequestException('Friendship not found');
    }

    if (friendAsUser) {
      await this.prisma.friend.delete({
        where: {
          userId_friendId: {
            userId,
            friendId,
          },
        },
      });
    }
    if (friendAsFriend) {
      await this.prisma.friend.delete({
        where: {
          userId_friendId: {
            userId: friendId,
            friendId: userId,
          },
        },
      });
    }

    this.socketGateway.emitToRoom(`user:${friendId}`, 'friendRemoved', {
      userId,
      friendId,
    });

    this.socketGateway.emitToRoom(`user:${userId}`, 'friendRemoved', {
      userId,
      friendId,
    });

    return {
      message: 'Unfriended successfully',
      data: {
        userId,
        friendId,
      },
    };
  }
}
