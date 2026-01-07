import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdminAnalyticsService } from '../services/admin-analytics.service';

@Injectable()
export class AdminAnalyticsJob {
  private readonly logger = new Logger(AdminAnalyticsJob.name);

  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Cron('02 10 * * *', {
    name: 'admin-analytics-daily',
    timeZone: 'Asia/Bangkok', // UTC+7
  })
  async handleDailyAnalytics() {
    try {
      this.logger.log('Starting daily analytics job...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await this.adminAnalyticsService.calculateDailyAnalytics(yesterday);

      await this.adminAnalyticsService.updateOverview();

      this.logger.log('Daily analytics job completed successfully');
    } catch (error) {
      this.logger.error('Error in daily analytics job:', error);
    }
  }
}
