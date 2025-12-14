import { Module } from '@nestjs/common';
import { AnalyticsClientController } from './analytics-client.controller';
import { AnalyticsClientService } from './analytics-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsClientController],
  providers: [AnalyticsClientService],
  exports: [AnalyticsClientService],
})
export class AnalyticsClientModule {}
