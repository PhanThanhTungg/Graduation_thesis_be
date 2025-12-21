import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { RedisModule } from '../../../shared/redis/redis.module';
import { ClientUserController } from './client-user.controller';
import { ClientUserService } from './client-user.service';
import { OnlineStatusService } from './online-status.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ClientUserController],
  providers: [ClientUserService, OnlineStatusService],
  exports: [ClientUserService, OnlineStatusService],
})
export class ClientUserModule {}
