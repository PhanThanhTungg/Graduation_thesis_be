import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';
import {
  GetAnalyticsDto,
  GetAnalyticsHistoryDto,
  GetChartDataDto,
  GetCourseRatingHistoryDto,
} from './dto/get-analytics.dto';

@Injectable()
export class AnalyticsClientService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get real-time analytics data directly from database
   */
  async getCurrentAnalytics(
    dto: GetAnalyticsDto,
    currentUser: currentClientUser,
  ) {
    const timezone = dto.timezone || 'UTC';
    const userId = currentUser.id;

    // Get today's date in the specified timezone
    const today = dto.date ? new Date(dto.date) : new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Calculate previous period for comparison
    const previousStart = new Date(startOfDay);
    previousStart.setDate(previousStart.getDate() - 30);
    const previousEnd = new Date(startOfDay);
    previousEnd.setDate(previousEnd.getDate() - 1);

    // Get courses owned by teacher
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

    // Calculate total revenue from orders
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

    // Get new students count (students who enrolled in teacher's courses)
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

    // Get active courses count
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

    // Get reviews count
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

    // Calculate total fees (platform commission from orders)
    const totalFees = totalRevenue * 0.1; // Assuming 10% platform fee
    const previousFees = previousRevenue * 0.1;
    const feesChange =
      previousFees > 0 ? ((totalFees - previousFees) / previousFees) * 100 : 0;

    const response: successResponse = {
      message: 'Get current analytics successfully',
      data: {
        date: dto.date || new Date().toISOString().split('T')[0],
        timezone,
        summary: {
          totalRevenue,
          revenueChange: Math.round(revenueChange * 100) / 100,
          totalFees,
          feesChange: Math.round(feesChange * 100) / 100,
          newStudents: currentStudents,
          studentsChange: Math.round(studentsChange * 100) / 100,
          activeCourses,
          coursesChange: 0, // Can be calculated if needed
          avgRating: Math.round(avgRating * 100) / 100,
          ratingChange: 0, // Can be calculated if needed
        },
        metrics: {
          totalOrders: currentOrders._count.id,
          totalCourses: teacherCourses.length,
          totalLessons,
          totalReviews,
          totalStudents: teacherCourses.reduce(
            (sum, c) => sum + c.countStudent,
            0,
          ),
        },
      },
    };

    return response;
  }

  /**
   * Get historical analytics data from analytics table
   */
  async getAnalyticsHistory(
    dto: GetAnalyticsHistoryDto,
    currentUser: currentClientUser,
  ) {
    const timezone = dto.timezone || 'UTC';
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const analyticsHistory = await this.prisma.analytics.findMany({
      where: {
        userId: currentUser.id,
        timezone,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const response: successResponse = {
      message: 'Get analytics history successfully',
      data: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        timezone,
        history: analyticsHistory,
      },
    };

    return response;
  }

  /**
   * Get chart data for visitors/engagement
   */
  async getChartData(dto: GetChartDataDto, currentUser: currentClientUser) {
    const timeRange = dto.timeRange || '90d';
    const timezone = dto.timezone || 'UTC';
    const userId = currentUser.id;

    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Get teacher's courses
    const teacherCourses = await this.prisma.course.findMany({
      where: {
        teacherId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // Get chapters and lessons for view tracking
    const chapters = await this.prisma.chapter.findMany({
      where: {
        courseId: { in: courseIds },
      },
      select: { id: true },
    });
    const chapterIds = chapters.map((c) => c.id);

    // Generate chart data based on orders per day
    const orders = await this.prisma.order.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'success',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        finalPrice: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by date
    const chartData: {
      date: string;
      orders: number;
      revenue: number;
      profit: number;
    }[] = [];
    const dateMap = new Map<string, { orders: number; revenue: number }>();

    orders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(dateStr) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += order.finalPrice;
      dateMap.set(dateStr, existing);
    });

    // Fill in all dates in range
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const data = dateMap.get(dateStr) || { orders: 0, revenue: 0 };
      // Calculate profit as revenue minus platform fee (assume 10% platform fee)
      const profit = data.revenue * 0.9;
      chartData.push({
        date: dateStr,
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
      });
    }

    const response: successResponse = {
      message: 'Get chart data successfully',
      data: {
        timeRange,
        timezone,
        chartData,
      },
    };

    return response;
  }

  /**
   * Get analytics for a specific past date from analytics table
   */
  async getAnalyticsByDate(
    dto: GetAnalyticsDto,
    currentUser: currentClientUser,
  ) {
    if (!dto.date) {
      // If no date specified, get current real-time data
      return this.getCurrentAnalytics(dto, currentUser);
    }

    const timezone = dto.timezone || 'UTC';
    const requestedDate = new Date(dto.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If requested date is today, return real-time data
    if (requestedDate >= today) {
      return this.getCurrentAnalytics(dto, currentUser);
    }

    // Otherwise, query from analytics table
    const analytics = await this.prisma.analytics.findFirst({
      where: {
        userId: currentUser.id,
        timezone,
        date: requestedDate,
      },
    });

    if (!analytics) {
      // If no historical data found, return empty response
      const response: successResponse = {
        message: 'No analytics data found for this date',
        data: {
          date: dto.date,
          timezone,
          summary: {
            totalRevenue: 0,
            revenueChange: 0,
            newStudents: 0,
            studentsChange: 0,
            activeCourses: 0,
            coursesChange: 0,
            avgRating: 0,
            ratingChange: 0,
          },
          metrics: {
            totalOrders: 0,
            totalCourses: 0,
            totalLessons: 0,
            totalReviews: 0,
            totalStudents: 0,
          },
        },
      };
      return response;
    }

    const response: successResponse = {
      message: 'Get analytics successfully',
      data: {
        date: dto.date,
        timezone,
        summary: {
          totalRevenue: analytics.totalRevenue,
          revenueChange: analytics.revenueChange,
          totalFees: analytics.totalFees,
          feesChange: analytics.feesChange,
          newStudents: analytics.newStudents,
          studentsChange: analytics.studentsChange,
          activeCourses: analytics.activeCourses,
          coursesChange: analytics.coursesChange,
          avgRating: analytics.avgRating,
          ratingChange: analytics.ratingChange,
        },
        metrics: {
          totalOrders: analytics.totalOrders,
          totalCourses: analytics.totalCourses,
          totalLessons: analytics.totalLessons,
          totalReviews: analytics.totalReviews,
          totalStudents: analytics.totalUsers,
        },
        chartData: analytics.chartData,
      },
    };

    return response;
  }

  /**
   * Get top 5 courses by revenue
   */
  async getTopCourses(currentUser: currentClientUser) {
    const userId = currentUser.id;

    // Get teacher's courses with their order data
    const courses = await this.prisma.course.findMany({
      where: {
        teacherId: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        rating: true,
        countStudent: true,
        orders: {
          where: {
            status: 'success',
          },
          select: {
            finalPrice: true,
          },
        },
      },
    });

    // Calculate total revenue for each course and format the data
    const coursesWithRevenue = courses.map((course) => {
      const totalRevenue = course.orders.reduce(
        (sum, order) => sum + order.finalPrice,
        0,
      );
      return {
        id: course.id,
        name: course.title,
        revenue: Math.round(totalRevenue * 100) / 100,
        rating: Math.round(course.rating * 10) / 10,
        students: course.countStudent,
      };
    });

    // Sort by revenue and take top 5
    const topCourses = coursesWithRevenue
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const response: successResponse = {
      message: 'Get top courses successfully',
      data: topCourses,
    };

    return response;
  }

  /**
   * Get students distribution by country
   */
  async getStudentsByCountry(currentUser: currentClientUser) {
    const userId = currentUser.id;

    // Get teacher's courses
    const teacherCourses = await this.prisma.course.findMany({
      where: {
        teacherId: userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const courseIds = teacherCourses.map((c) => c.id);

    // Get all students who have purchased teacher's courses
    const orders = await this.prisma.order.findMany({
      where: {
        courseId: { in: courseIds },
        status: 'success',
      },
      select: {
        userId: true,
        user: {
          select: {
            country: true,
          },
        },
      },
    });

    // Count students by country (use Set to avoid counting same user multiple times)
    const countryMap = new Map<string, Set<string>>();
    orders.forEach((order) => {
      const country = order.user.country || 'Unknown';
      if (!countryMap.has(country)) {
        countryMap.set(country, new Set());
      }
      countryMap.get(country)!.add(order.userId);
    });

    // Convert to array with unique student counts and sort by count
    const studentsByCountry = Array.from(countryMap.entries())
      .map(([country, studentIds]) => ({ country, count: studentIds.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 countries

    const response: successResponse = {
      message: 'Get students by country successfully',
      data: studentsByCountry,
    };

    return response;
  }

  /**
   * Get course rating and review history over time
   */
  async getCourseRatingHistory(
    courseId: string,
    dto: GetCourseRatingHistoryDto,
    currentUser: currentClientUser,
  ) {
    // Validate courseId
    if (!courseId || courseId.trim() === '') {
      throw new BadRequestException('Course ID is required');
    }

    const timeRange = dto.timeRange || '90d';
    const userId = currentUser.id;

    // Verify the course belongs to the teacher
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: userId,
        deletedAt: null,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found or access denied');
    }

    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);

    // Get reviews for the course
    const reviews = await this.prisma.review.findMany({
      where: {
        courseId: courseId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        rating: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group reviews by date
    const dateMap = new Map<string, { ratings: number[]; count: number }>();

    reviews.forEach((review) => {
      const dateStr = review.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(dateStr) || { ratings: [], count: 0 };
      existing.ratings.push(review.rating);
      existing.count += 1;
      dateMap.set(dateStr, existing);
    });

    // Calculate average rating for each date
    const chartData: { date: string; rating: number; reviews: number }[] = [];
    let cumulativeRating = course.rating;

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      const data = dateMap.get(dateStr);

      if (data && data.ratings.length > 0) {
        const avgRating =
          data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length;
        cumulativeRating = avgRating;
        chartData.push({
          date: dateStr,
          rating: Math.round(avgRating * 10) / 10,
          reviews: data.count,
        });
      } else {
        chartData.push({
          date: dateStr,
          rating: Math.round(cumulativeRating * 10) / 10,
          reviews: 0,
        });
      }
    }

    const response: successResponse = {
      message: 'Get course rating history successfully',
      data: {
        courseId,
        courseName: course.title,
        timeRange,
        chartData,
      },
    };

    return response;
  }
}
