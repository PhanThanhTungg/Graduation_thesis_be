import { Module } from '@nestjs/common';
import { AnalyticsCronService } from './analytics-cron.service';
import { AnalyticsClientModule } from './client/analytics-client.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AnalyticsClientModule],
  providers: [AnalyticsCronService],
  exports: [AnalyticsCronService, AnalyticsClientModule],
})
export class AnalyticsModule {}
