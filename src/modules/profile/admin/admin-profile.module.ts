import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminProfileController],
  providers: [AdminProfileService],
  exports: [AdminProfileService],
})
export class AdminProfileModule {}
