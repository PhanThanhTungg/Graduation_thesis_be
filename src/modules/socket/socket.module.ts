import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SocketChatService } from './socket-chat.service';

@Module({
  providers: [SocketGateway, SocketChatService],
  exports: [SocketGateway, SocketChatService],
})
export class SocketModule {}
