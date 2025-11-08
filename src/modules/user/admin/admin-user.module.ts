import { Module } from '@nestjs/common';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { PrismaModule } from '../../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminUserController],
  providers: [AdminUserService],
})
export class AdminUserModule {}