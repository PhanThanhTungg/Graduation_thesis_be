import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { ClientUserController } from './client-user.controller';
import { ClientUserService } from './client-user.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientUserController],
  providers: [ClientUserService],
  exports: [ClientUserService],
})
export class ClientUserModule {}
