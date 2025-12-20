import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { ChatClientController } from './chat-client.controller';
import { ChatClientService } from './chat-client.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChatClientController],
  providers: [ChatClientService],
  exports: [ChatClientService],
})
export class ChatClientModule {}
