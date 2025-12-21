import { Injectable } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketChatService {
  constructor(private readonly socketGateway: SocketGateway) {}

  emitNewMessage(conversationId: string, messageData: any) {
    this.socketGateway.emitToRoom(
      `conversation:${conversationId}`,
      'newMessage',
      messageData,
    );
  }

  emitConversationUpdated(
    conversationId: string,
    lastMessage: any,
    updatedAt: Date,
  ) {
    this.socketGateway.emitToAll('conversationUpdated', {
      conversationId,
      lastMessage: {
        id: lastMessage.id,
        message: lastMessage.message,
        senderId: lastMessage.senderId,
        senderName: lastMessage.senderName,
        createdAt: lastMessage.createdAt,
      },
      updatedAt: updatedAt.toISOString(),
    });
  }
}
