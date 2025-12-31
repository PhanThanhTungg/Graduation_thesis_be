import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { AdminSettingController } from './admin-setting.controller';
import { AdminSettingService } from './admin-setting.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminSettingController],
  providers: [AdminSettingService],
  exports: [AdminSettingService],
})
export class AdminSettingModule {}
