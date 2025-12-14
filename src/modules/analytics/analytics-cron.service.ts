import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { CronJob } from 'cron';

// List of common timezones to collect analytics for
// List of all IANA timezones (partial list for brevity, you can expand as needed)
const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Europe/Athens',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Jakarta',
  'Asia/Ho_Chi_Minh',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Pacific/Auckland',
];

@Injectable()
export class AnalyticsCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsCronService.name);
  private cronJobs: Map<string, CronJob> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initializeCronJobs();
  }
  
  onModuleDestroy() {
    // Stop all cron jobs when module is destroyed
    this.cronJobs.forEach((job, timezone) => {
      job.stop();
      this.logger.log(`Stopped cron job for timezone: ${timezone}`);
    });
  }

  /**
   * Initialize cron jobs for each timezone
   * Each timezone will have its own cron job that runs at 23:59:59 local time
   */
  private initializeCronJobs() {
    for (const timezone of SUPPORTED_TIMEZONES) {
      // Create cron job for 23:59:59 in each timezone
      const cronJob = new CronJob(
        '59 59 23 * * *', // Run at 23:59:59 every day
        () => this.collectAnalyticsForTimezone(timezone),
        null,
        true, // Start the job right now
        timezone, // Set timezone
      );

      this.cronJobs.set(timezone, cronJob);
      this.logger.log(`Initialized cron job for timezone: ${timezone}`);
    }
  }

  /**
   * Collect and store analytics for a specific timezone
   */
  async collectAnalyticsForTimezone(timezone: string) {
    this.logger.log(`Starting analytics collection for timezone: ${timezone}`);

    try {
      // Get all teachers
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

      // Filter teachers by matching timezone
      const relevantTeachers = teachers.filter(
        (teacher) => teacher.timezone === timezone,
      );

      this.logger.log(
        `Found ${relevantTeachers.length} teachers for timezone ${timezone}`,
      );

      // Collect analytics for each teacher
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

  /**
   * Collect analytics for a specific teacher
   */
  async collectTeacherAnalytics(userId: string, timezone: string) {
    try {
      const today = new Date();
      const dateOnly = new Date(today.toISOString().split('T')[0]); // Get date without time

      // Get today's date boundaries
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Calculate previous period for comparison (last 30 days)
      const previousStart = new Date(startOfDay);
      previousStart.setDate(previousStart.getDate() - 30);
      const previousEnd = new Date(startOfDay);
      previousEnd.setDate(previousEnd.getDate() - 1);

      // Get teacher's courses
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

      // Calculate revenue and orders
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

      // Get new students
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

      // Get active courses
      const activeCourses = await this.prisma.course.count({
        where: {
          teacherId: userId,
          isPublished: true,
          deletedAt: null,
        },
      });

      // Calculate average rating
      const avgRating =
        teacherCourses.length > 0
          ? teacherCourses.reduce((sum, c) => sum + c.rating, 0) /
            teacherCourses.length
          : 0;

      // Get total reviews
      const totalReviews = await this.prisma.review.count({
        where: {
          courseId: { in: courseIds },
        },
      });

      // Get total lessons
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

      // Calculate platform fees (10% commission)
      const totalFees = totalRevenue * 0.1;
      const previousFees = previousRevenue * 0.1;
      const feesChange =
        previousFees > 0
          ? ((totalFees - previousFees) / previousFees) * 100
          : 0;

      // Generate chart data for the day (orders and revenue per hour or summary)
      const chartData = {
        orders: currentOrders._count.id,
        revenue: totalRevenue,
        students: currentStudents,
      };

      // Upsert analytics record
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
          totalUsers: teacherCourses.reduce((sum, c) => sum + c.countStudent, 0),
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
          totalUsers: teacherCourses.reduce((sum, c) => sum + c.countStudent, 0),
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

  /**
   * Manual trigger for collecting analytics (useful for testing or backfilling)
   */
  async manualCollectAnalytics(timezone?: string) {
    if (timezone) {
      await this.collectAnalyticsForTimezone(timezone);
    } else {
      // Collect for all timezones
      for (const tz of SUPPORTED_TIMEZONES) {
        await this.collectAnalyticsForTimezone(tz);
      }
    }
  }
}
