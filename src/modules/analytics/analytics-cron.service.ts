import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CronJob } from 'cron';

@Injectable()
export class AnalyticsCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsCronService.name);
  private cronJob: CronJob;
  private supportedTimezones: string[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadSupportedTimezones();
    this.initializeCronJob();
  }

  onModuleDestroy() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.logger.log('Stopped analytics cron job');
    }
  }

  private loadSupportedTimezones() {
    try {
      this.supportedTimezones = Intl.supportedValuesOf('timeZone');
      this.logger.log(
        `Loaded ${this.supportedTimezones.length} supported timezones`,
      );
    } catch (error) {
      this.logger.error('Error loading timezones:', error.message);
      this.supportedTimezones = ['UTC'];
      this.logger.warn('Using fallback timezone list: UTC only');
    }
  }

  private initializeCronJob() {
    this.cronJob = new CronJob(
      '*/10 * * * * *',
      () => this.checkAndCollectAnalytics(),
      null,
      true,
    );

    console.log('Initialized analytics cron job (runs hourly)');
  }

  private async checkAndCollectAnalytics() {
    this.logger.log('Checking timezones for analytics collection...');

    const now = new Date();
    const timezonesInRange: string[] = [];

    for (const timezone of this.supportedTimezones) {
      try {
        const localTime = new Date(
          now.toLocaleString('en-US', { timeZone: timezone }),
        );
        const hour = localTime.getHours();
        const currentHour = now.getHours();

        if (hour === currentHour) {
          timezonesInRange.push(timezone);
        }
      } catch (error) {
        this.logger.error(
          `Error checking timezone ${timezone}:`,
          error.message,
        );
      }
    }

    console.log(
      `Found ${timezonesInRange.length} timezones in range (23:00-23:59): ${timezonesInRange.join(', ')}`,
    );

    for (const timezone of timezonesInRange) {
      await this.collectAnalyticsForTimezone(timezone);
    }
  }

  async collectAnalyticsForTimezone(timezone: string) {
    this.logger.log(`Starting analytics collection for timezone: ${timezone}`);

    try {
      const teachers = await this.prisma.user.findMany({
        where: {
          role: 'teacher',
          deletedAt: null,
          status: 'active',
        },
        select: {
          id: true,
          timezone: true,
        },
      });

      const relevantTeachers = teachers.filter(
        (teacher) => teacher.timezone === timezone,
      );

      this.logger.log(
        `Found ${relevantTeachers.length} teachers for timezone ${timezone}`,
      );

      for (const teacher of relevantTeachers) {
        await this.collectTeacherAnalytics(teacher.id, timezone);
      }

      this.logger.log(
        `Completed analytics collection for timezone: ${timezone}`,
      );
    } catch (error) {
      this.logger.error(
        `Error collecting analytics for timezone ${timezone}:`,
        error,
      );
    }
  }

  async collectTeacherAnalytics(userId: string, timezone: string) {
    try {
      const today = new Date();
      const dateOnly = new Date(today.toISOString().split('T')[0]); // Get date without time

      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const previousStart = new Date(startOfDay);
      previousStart.setDate(previousStart.getDate() - 30);
      const previousEnd = new Date(startOfDay);
      previousEnd.setDate(previousEnd.getDate() - 1);

      const teacherCourses = await this.prisma.course.findMany({
        where: {
          teacherId: userId,
          deletedAt: null,
        },
        select: {
          id: true,
          rating: true,
          countStudent: true,
          price: true,
        },
      });

      const courseIds = teacherCourses.map((c) => c.id);

      const [currentOrders, previousOrders] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            courseId: { in: courseIds },
            status: 'success',
            completedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          _sum: { finalPrice: true },
          _count: { id: true },
        }),
        this.prisma.order.aggregate({
          where: {
            courseId: { in: courseIds },
            status: 'success',
            completedAt: {
              gte: previousStart,
              lte: previousEnd,
            },
          },
          _sum: { finalPrice: true },
          _count: { id: true },
        }),
      ]);

      const totalRevenue = currentOrders._sum.finalPrice || 0;
      const previousRevenue = previousOrders._sum.finalPrice || 0;
      const revenueChange =
        previousRevenue > 0
          ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      const [currentStudents, previousStudents] = await Promise.all([
        this.prisma.order.count({
          where: {
            courseId: { in: courseIds },
            status: 'success',
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        this.prisma.order.count({
          where: {
            courseId: { in: courseIds },
            status: 'success',
            createdAt: {
              gte: previousStart,
              lte: previousEnd,
            },
          },
        }),
      ]);

      const studentsChange =
        previousStudents > 0
          ? ((currentStudents - previousStudents) / previousStudents) * 100
          : 0;

      const activeCourses = await this.prisma.course.count({
        where: {
          teacherId: userId,
          isPublished: true,
          deletedAt: null,
        },
      });

      const avgRating =
        teacherCourses.length > 0
          ? teacherCourses.reduce((sum, c) => sum + c.rating, 0) /
            teacherCourses.length
          : 0;

      const totalReviews = await this.prisma.review.count({
        where: {
          courseId: { in: courseIds },
        },
      });

      const chapters = await this.prisma.chapter.findMany({
        where: {
          courseId: { in: courseIds },
        },
        select: { id: true },
      });
      const chapterIds = chapters.map((c) => c.id);

      const totalLessons = await this.prisma.lesson.count({
        where: {
          chapterId: { in: chapterIds },
        },
      });

      const totalFees = totalRevenue * 0.1;
      const previousFees = previousRevenue * 0.1;
      const feesChange =
        previousFees > 0
          ? ((totalFees - previousFees) / previousFees) * 100
          : 0;

      const chartData = {
        orders: currentOrders._count.id,
        revenue: totalRevenue,
        students: currentStudents,
      };

      await this.prisma.analytics.upsert({
        where: {
          date_timezone_userId: {
            date: dateOnly,
            timezone,
            userId,
          },
        },
        update: {
          totalRevenue,
          revenueChange: Math.round(revenueChange * 100) / 100,
          totalFees,
          feesChange: Math.round(feesChange * 100) / 100,
          newStudents: currentStudents,
          studentsChange: Math.round(studentsChange * 100) / 100,
          activeCourses,
          coursesChange: 0,
          avgRating: Math.round(avgRating * 100) / 100,
          ratingChange: 0,
          totalOrders: currentOrders._count.id,
          totalUsers: teacherCourses.reduce(
            (sum, c) => sum + c.countStudent,
            0,
          ),
          totalCourses: teacherCourses.length,
          totalLessons,
          totalReviews,
          chartData,
        },
        create: {
          date: dateOnly,
          timezone,
          userId,
          totalRevenue,
          revenueChange: Math.round(revenueChange * 100) / 100,
          totalFees,
          feesChange: Math.round(feesChange * 100) / 100,
          newStudents: currentStudents,
          studentsChange: Math.round(studentsChange * 100) / 100,
          activeCourses,
          coursesChange: 0,
          avgRating: Math.round(avgRating * 100) / 100,
          ratingChange: 0,
          totalOrders: currentOrders._count.id,
          totalUsers: teacherCourses.reduce(
            (sum, c) => sum + c.countStudent,
            0,
          ),
          totalCourses: teacherCourses.length,
          totalLessons,
          totalReviews,
          chartData,
        },
      });

      this.logger.log(
        `Saved analytics for teacher ${userId} in timezone ${timezone}`,
      );
    } catch (error) {
      this.logger.error(
        `Error collecting analytics for teacher ${userId}:`,
        error,
      );
    }
  }

  async manualCollectAnalytics(timezone?: string) {
    if (timezone) {
      await this.collectAnalyticsForTimezone(timezone);
    } else {
      // Collect for all timezones
      for (const tz of this.supportedTimezones) {
        await this.collectAnalyticsForTimezone(tz);
      }
    }
  }
}
