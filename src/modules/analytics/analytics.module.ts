import { Module } from '@nestjs/common';
import { AnalyticsCronService } from './analytics-cron.service';
import { AnalyticsClientModule } from './client/analytics-client.module';
import { AdminAnalyticsModule } from './admin/analytics.module';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AnalyticsClientModule, AdminAnalyticsModule],
  providers: [AnalyticsCronService],
  exports: [AnalyticsCronService, AnalyticsClientModule, AdminAnalyticsModule],
})
export class AnalyticsModule {}
