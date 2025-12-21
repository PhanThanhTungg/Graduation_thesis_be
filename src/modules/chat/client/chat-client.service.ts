import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { SocketChatService } from '../../socket/socket-chat.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { ConversationMemberRole } from '@prisma/client';

@Injectable()
export class ChatClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketChatService: SocketChatService,
  ) {}

  async createOrGetConversation(
    currentUserId: string,
    targetUserId: string,
  ): Promise<successResponse> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot create conversation with yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: targetUserId,
        deletedAt: null,
        status: 'active',
      },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    const existingConversations = await this.prisma.conversation.findMany({
      where: {
        isGroup: false,
        members: {
          some: {
            userId: currentUserId,
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    const existingConversation = existingConversations.find(
      (conv) =>
        conv._count.members === 2 &&
        conv.members.some((m) => m.userId === currentUserId) &&
        conv.members.some((m) => m.userId === targetUserId),
    );

    if (existingConversation && existingConversation._count.members === 2) {
      const otherMember = existingConversation.members.find(
        (m) => m.userId !== currentUserId,
      );

      return {
        message: 'Conversation found',
        data: {
          id: existingConversation.id,
          name: existingConversation.name,
          isGroup: existingConversation.isGroup,
          createdAt: existingConversation.createdAt,
          updatedAt: existingConversation.updatedAt,
          otherUser: {
            id: otherMember?.user.id,
            name: otherMember?.user.fullName,
            avatar: otherMember?.user.avatarUrl,
          },
        },
      };
    }

    const newConversation = await this.prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          createMany: {
            data: [
              {
                userId: currentUserId,
              },
              {
                userId: targetUserId,
              },
            ],
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
      },
    });

    const otherMember = newConversation.members.find(
      (m) => m.userId !== currentUserId,
    );

    return {
      message: 'Conversation created successfully',
      data: {
        id: newConversation.id,
        name: newConversation.name,
        isGroup: newConversation.isGroup,
        createdAt: newConversation.createdAt,
        updatedAt: newConversation.updatedAt,
        otherUser: {
          id: otherMember?.user.id,
          name: otherMember?.user.fullName,
          avatar: otherMember?.user.avatarUrl,
        },
      },
    };
  }

  async sendMessage(
    currentUserId: string,
    conversationId: string,
    message: string,
  ): Promise<successResponse> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isMember = conversation.members.some(
      (member) => member.userId === currentUserId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    const newMessage = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: currentUserId,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const messageData = {
      id: newMessage.id,
      conversationId: newMessage.conversationId,
      message: newMessage.message,
      senderId: newMessage.senderId,
      sender: {
        id: newMessage.sender.id,
        name: newMessage.sender.fullName,
        avatar: newMessage.sender.avatarUrl,
      },
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };

    this.socketChatService.emitNewMessage(conversationId, messageData);

    this.socketChatService.emitConversationUpdated(
      conversationId,
      {
        id: newMessage.id,
        message: newMessage.message,
        senderId: newMessage.senderId,
        senderName: newMessage.sender.fullName,
        createdAt: newMessage.createdAt,
      },
      newMessage.createdAt,
    );

    return {
      message: 'Message sent successfully',
      data: messageData,
    };
  }

  async getConversations(currentUserId: string): Promise<successResponse> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: currentUserId,
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
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const transformedConversations = conversations.map((conv) => {
      const otherMember = conv.members.find((m) => m.userId !== currentUserId);
      const lastMessage = conv.messages[0];

      const conversationData: any = {
        id: conv.id,
        isGroup: conv.isGroup,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };

      if (conv.isGroup) {
        conversationData.name = conv.name || 'Group';
        conversationData.avatar = null;
      } else {
        conversationData.name = otherMember?.user.fullName || 'Unknown';
        conversationData.avatar = otherMember?.user.avatarUrl;
        conversationData.otherUser = {
          id: otherMember?.user.id,
          name: otherMember?.user.fullName,
          avatar: otherMember?.user.avatarUrl,
        };
      }

      if (lastMessage) {
        conversationData.lastMessage = {
          id: lastMessage.id,
          message: lastMessage.message,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.fullName,
          createdAt: lastMessage.createdAt,
        };
      }

      return conversationData;
    });

    return {
      message: 'Get conversations successfully',
      data: transformedConversations,
    };
  }

  async getMessages(
    currentUserId: string,
    conversationId: string,
  ): Promise<successResponse> {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isMember = conversation.members.some(
      (member) => member.userId === currentUserId,
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      message: msg.message,
      senderId: msg.senderId,
      sender: {
        id: msg.sender.id,
        name: msg.sender.fullName,
        avatar: msg.sender.avatarUrl,
      },
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

    return {
      message: 'Get messages successfully',
      data: transformedMessages,
    };
  }

  async createGroup(
    currentUserId: string,
    name: string,
    userIds: string[],
  ): Promise<successResponse> {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException('Group name is required');
    }

    if (name.length > 50) {
      throw new BadRequestException(
        'Group name must be less than 50 characters',
      );
    }

    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('At least one member must be added');
    }

    const uniqueUserIds = [...new Set(userIds)];
    if (uniqueUserIds.includes(currentUserId)) {
      throw new BadRequestException('Cannot add yourself to the group');
    }

    if (uniqueUserIds.length !== userIds.length) {
      throw new BadRequestException('Duplicate user IDs are not allowed');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: uniqueUserIds,
        },
        deletedAt: null,
        status: 'active',
      },
      select: {
        id: true,
      },
    });

    if (users.length !== uniqueUserIds.length) {
      throw new BadRequestException('One or more users not found');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        name: name.trim(),
        isGroup: true,
        members: {
          createMany: {
            data: [
              {
                userId: currentUserId,
                role: ConversationMemberRole.admin,
              },
              ...uniqueUserIds.map((userId) => ({
                userId,
                role: ConversationMemberRole.member,
              })),
            ],
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
      },
    });

    return {
      message: 'Group created successfully',
      data: {
        id: conversation.id,
        name: conversation.name,
        isGroup: true,
        memberCount: conversation.members.length,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    };
  }
}
