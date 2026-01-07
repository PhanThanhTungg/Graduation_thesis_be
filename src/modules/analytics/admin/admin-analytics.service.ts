import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  GetAnalyticsResponseDto,
  DailyAnalyticsDto,
  OverviewAnalyticsDto,
} from './dto/get-analytics-response.dto';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<GetAnalyticsResponseDto> {
    try {
      // Normalize dates to start and end of day
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const isEndDateToday =
        endOfDay.getTime() >= today.getTime() &&
        endOfDay.getDate() === today.getDate() &&
        endOfDay.getMonth() === today.getMonth() &&
        endOfDay.getFullYear() === today.getFullYear();

      this.logger.log(
        `Getting analytics from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`,
      );
      this.logger.log(`Is end date today: ${isEndDateToday}`);

      // Get daily analytics
      let dailyAnalytics: DailyAnalyticsDto[] = [];

      if (isEndDateToday) {
        // Lấy dữ liệu historical từ database (các ngày trước hôm nay)
        const historicalData = await this.prisma.adminAnalytic.findMany({
          where: {
            date: {
              gte: startOfDay,
              lt: today,
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        // Tính toán dữ liệu của ngày hôm nay từ database
        const todayData = await this.calculateTodayAnalytics(today);

        dailyAnalytics = [
          ...historicalData.map((item) => ({
            date: item.date,
            revenue: item.revenue,
            platformFee: item.platformFee,
            student: item.student,
            teacher: item.teacher,
          })),
          todayData,
        ];
      } else {
        // Nếu endDate không phải hôm nay, chỉ lấy từ AdminAnalytic table
        const historicalData = await this.prisma.adminAnalytic.findMany({
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          orderBy: {
            date: 'asc',
          },
        });

        dailyAnalytics = historicalData.map((item) => ({
          date: item.date,
          revenue: item.revenue,
          platformFee: item.platformFee,
          student: item.student,
          teacher: item.teacher,
        }));
      }

      // Get overview
      const overview = await this.getOverview();

      return {
        dailyAnalytics,
        overview,
      };
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  private async calculateTodayAnalytics(
    today: Date,
  ): Promise<DailyAnalyticsDto> {
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    this.logger.log(`Calculating today's analytics from database`);

    const [
      revenueResult,
      platformFeeResult,
      newStudentsCount,
      newTeachersCount,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: 'success',
          completedAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: {
          finalPrice: true,
        },
      }),
      this.prisma.platformTransaction.aggregate({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
          type: 'commission_income',
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'student',
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      this.prisma.user.count({
        where: {
          role: 'teacher',
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
    ]);

    const revenue = revenueResult._sum.finalPrice || 0;
    const platformFee = platformFeeResult._sum.amount || 0;

    return {
      date: today,
      revenue,
      platformFee,
      student: newStudentsCount,
      teacher: newTeachersCount,
    };
  }

  private async getOverview(): Promise<OverviewAnalyticsDto> {
    const overview = await this.prisma.adminAnalyticsOverview.findFirst();

    if (!overview) {
      return {
        totalStudents: 0,
        totalTeachers: 0,
        totalRevenue: 0,
        totalCourses: 0,
        totalPlatformFee: 0,
        revenueByCategory: {},
        top5TeachersByStudentCount: [],
        top5CoursesByStudentCount: [],
      };
    }

    return {
      totalStudents: overview.totalStudents,
      totalTeachers: overview.totalTeachers,
      totalRevenue: overview.totalRevenue,
      totalCourses: overview.totalCourses,
      totalPlatformFee: overview.totalPlatformFee,
      revenueByCategory:
        (overview.revenueByCategory as Record<string, number>) || {},
      top5TeachersByStudentCount:
        (overview.top5TeachersByStudentCount as any[]) || [],
      top5CoursesByStudentCount:
        (overview.top5CoursesByStudentCount as any[]) || [],
    };
  }
}
