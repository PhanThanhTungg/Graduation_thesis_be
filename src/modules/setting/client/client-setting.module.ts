import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { ClientSettingController } from './client-setting.controller';
import { ClientSettingService } from './client-setting.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClientSettingController],
  providers: [ClientSettingService],
  exports: [ClientSettingService],
})
export class ClientSettingModule {}
