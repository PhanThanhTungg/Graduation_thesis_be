import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculateDailyAnalytics(date: Date): Promise<{
    revenue: number;
    platformFee: number;
    newStudentsCount: number;
    newTeachersCount: number;
  }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      this.logger.log(
        `Calculating daily analytics for ${startOfDay.toISOString()}`,
      );

      const revenueResult = await this.prisma.order.aggregate({
        where: {
          status: 'success',
          completedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: {
          finalPrice: true,
        },
      });

      const revenue = revenueResult._sum.finalPrice || 0;

      const platformFeeResult = await this.prisma.platformTransaction.aggregate(
        {
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            type: 'commission_income',
          },
          _sum: {
            amount: true,
          },
        },
      );

      const platformFee = platformFeeResult._sum.amount || 0;

      const newStudentsCount = await this.prisma.user.count({
        where: {
          role: 'student',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const newTeachersCount = await this.prisma.user.count({
        where: {
          role: 'teacher',
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      await this.prisma.adminAnalytic.upsert({
        where: { date: startOfDay },
        update: {
          revenue,
          platformFee,
          student: newStudentsCount,
          teacher: newTeachersCount,
        },
        create: {
          date: startOfDay,
          revenue,
          platformFee,
          student: newStudentsCount,
          teacher: newTeachersCount,
        },
      });

      this.logger.log(
        `Daily analytics saved: Revenue=${revenue}, PlatformFee=${platformFee}, Students=${newStudentsCount}, Teachers=${newTeachersCount}`,
      );

      return {
        revenue,
        platformFee,
        newStudentsCount,
        newTeachersCount,
      };
    } catch (error) {
      this.logger.error('Error calculating daily analytics:', error);
      throw error;
    }
  }

  async updateOverview(): Promise<void> {
    try {
      this.logger.log('Updating analytics overview...');

      const [
        totalRevenueResult,
        totalPlatformFeeResult,
        totalStudents,
        totalTeachers,
        totalCourses,
      ] = await Promise.all([
        this.prisma.order.aggregate({
          where: { status: 'success' },
          _sum: { finalPrice: true },
        }),
        this.prisma.platformTransaction.aggregate({
          where: { type: 'commission_income' },
          _sum: { amount: true },
        }),
        this.prisma.user.count({
          where: { role: 'student', deletedAt: null },
        }),
        this.prisma.user.count({
          where: { role: 'teacher', deletedAt: null },
        }),
        this.prisma.course.count({
          where: { deletedAt: null },
        }),
      ]);

      const totalRevenue = totalRevenueResult._sum.finalPrice || 0;
      const totalPlatformFee = totalPlatformFeeResult._sum.amount || 0;

      const revenueByCategory = await this.prisma.$queryRaw<
        { categoryName: string; revenue: number }[]
      >`
        SELECT 
          COALESCE(cat.title, 'Uncategorized') as "categoryName",
          COALESCE(SUM(o."final_price"), 0) as "revenue"
        FROM "courses" c
        LEFT JOIN "category" cat ON cat.id = c."category_id" AND cat."deleted_at" IS NULL
        LEFT JOIN "order" o ON o."course_id" = c.id AND o.status = 'success'
        WHERE c."deleted_at" IS NULL
        GROUP BY cat.title
        ORDER BY "revenue" DESC
      `;

      const top5Teachers = await this.prisma.$queryRaw<
        {
          teacherId: string;
          fullName: string;
          email: string;
          studentCount: bigint;
          courseCount: bigint;
          revenue: number;
        }[]
      >`
        SELECT 
          u.id as "teacherId",
          u."full_name" as "fullName",
          u.email as "email",
          COUNT(DISTINCT o."user_id") as "studentCount",
          COUNT(DISTINCT c.id) as "courseCount",
          COALESCE(SUM(o."final_price"), 0) as "revenue"
        FROM "user" u
        INNER JOIN "courses" c ON c."teacher_id" = u.id AND c."deleted_at" IS NULL
        LEFT JOIN "order" o ON o."course_id" = c.id AND o.status = 'success'
        WHERE u.role = 'teacher' AND u."deleted_at" IS NULL
        GROUP BY u.id, u."full_name", u.email
        ORDER BY "studentCount" DESC, "revenue" DESC
        LIMIT 5
      `;

      const top5Courses = await this.prisma.$queryRaw<
        {
          courseId: string;
          title: string;
          teacherFullName: string;
          studentCount: bigint;
          revenue: number;
          rating: number;
        }[]
      >`
        SELECT 
          c.id as "courseId",
          c.title,
          u."full_name" as "teacherFullName",
          COUNT(DISTINCT o."user_id") as "studentCount",
          COALESCE(SUM(o."final_price"), 0) as "revenue",
          c.rating as "rating"
        FROM "courses" c
        INNER JOIN "user" u ON u.id = c."teacher_id"
        LEFT JOIN "order" o ON o."course_id" = c.id AND o.status = 'success'
        WHERE c."deleted_at" IS NULL
        GROUP BY c.id, c.title, u."full_name", c.rating
        ORDER BY "studentCount" DESC, "revenue" DESC
        LIMIT 5
      `;

      const top5TeachersData = top5Teachers.map((t) => ({
        teacherId: t.teacherId,
        fullName: t.fullName,
        email: t.email,
        studentCount: Number(t.studentCount),
        courseCount: Number(t.courseCount),
        revenue: t.revenue,
      }));

      const top5CoursesData = top5Courses.map((c) => ({
        courseId: c.courseId,
        title: c.title,
        teacherFullName: c.teacherFullName,
        studentCount: Number(c.studentCount),
        revenue: c.revenue,
        rating: c.rating,
      }));

      const revenueByCategoryData = revenueByCategory.reduce(
        (acc, item) => {
          acc[item.categoryName] = item.revenue;
          return acc;
        },
        {} as Record<string, number>,
      );

      const overview = await this.prisma.adminAnalyticsOverview.findFirst();

      if (overview) {
        await this.prisma.adminAnalyticsOverview.update({
          where: { id: overview.id },
          data: {
            totalStudents,
            totalTeachers,
            totalRevenue,
            totalCourses,
            totalPlatformFee,
            revenueByCategory: revenueByCategoryData,
            top5TeachersByStudentCount: top5TeachersData,
            top5CoursesByStudentCount: top5CoursesData,
          },
        });
      } else {
        await this.prisma.adminAnalyticsOverview.create({
          data: {
            totalStudents,
            totalTeachers,
            totalRevenue,
            totalCourses,
            totalPlatformFee,
            revenueByCategory: revenueByCategoryData,
            top5TeachersByStudentCount: top5TeachersData,
            top5CoursesByStudentCount: top5CoursesData,
          },
        });
      }

      this.logger.log(
        `Overview updated: Students=${totalStudents}, Teachers=${totalTeachers}, Revenue=${totalRevenue}, Courses=${totalCourses}, PlatformFee=${totalPlatformFee}`,
      );
    } catch (error) {
      this.logger.error('Error updating overview:', error);
      throw error;
    }
  }
}
