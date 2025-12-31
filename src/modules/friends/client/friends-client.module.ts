import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { SocketModule } from '../../socket/socket.module';
import { FriendsClientController } from './friends-client.controller';
import { FriendsClientService } from './friends-client.service';

@Module({
  imports: [PrismaModule, SocketModule],
  controllers: [FriendsClientController],
  providers: [FriendsClientService],
  exports: [FriendsClientService],
})
export class FriendsClientModule {}
