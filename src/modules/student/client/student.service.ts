import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import {
  GetStudentsOfCourseDto,
  GetStudentsOfCourseResponseDto,
  StudentWithProgressDto,
  StudentBasicInfoDto,
  StudentLessonProgressDto,
  CourseStudentStatsDto,
} from './dto/student.dto';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách học sinh của một khóa học kèm theo tiến độ học tập
   * @param teacherId - ID của giáo viên
   * @param courseId - ID của khóa học
   * @param page - Trang hiện tại
   * @param limit - Số lượng học sinh trên một trang
   * @param search - Tìm kiếm theo tên hoặc email
   * @param progressFilter - Lọc theo tiến độ
   */
  async getStudentsOfCourse(
    teacherId: string,
    courseId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    progressFilter?: string,
  ): Promise<GetStudentsOfCourseResponseDto> {
    // Xác thực rằng khóa học thuộc về giáo viên
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: true,
      },
    });

    if (!course) {
      throw new NotFoundException(`Khóa học với ID ${courseId} không tồn tại`);
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
    }

    // Lấy tất cả học sinh đã mua khóa học này
    const orders = await this.prisma.order.findMany({
      where: {
        courseId: courseId,
        status: 'success', // Chỉ lấy các đơn hàng thành công
      },
      include: {
        user: true,
      },
    });

    const userIds = orders.map((order) => order.userId);

    // Lấy các bài học của khóa học
    const chapters = await this.prisma.chapter.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        lessons: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    const allLessons = chapters.flatMap((chapter) => chapter.lessons);

    // Lấy tiến độ của học sinh
    const where: any = {
      userId: {
        in: userIds,
      },
      lessonId: {
        in: allLessons.map((lesson) => lesson.id),
      },
    };

    if (progressFilter) {
      where.progress = progressFilter;
    }

    const allProgress = await this.prisma.userLessonProgress.findMany({
      where,
      include: {
        lesson: {
          include: {
            chapter: true,
          },
        },
      },
    });

    // Nhóm tiến độ theo userId
    const progressByUser = allProgress.reduce(
      (acc, progress) => {
        if (!acc[progress.userId]) {
          acc[progress.userId] = [];
        }
        acc[progress.userId].push(progress);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Xây dựng danh sách học sinh với thông tin tiến độ
    const studentsWithProgress: StudentWithProgressDto[] = orders
      .filter((order) => {
        // Lọc theo search nếu có
        if (search) {
          const searchLower = search.toLowerCase();
          const user = order.user;
          return (
            user.fullName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .map((order) => {
        const user = order.user;
        const userProgress = progressByUser[user.id] || [];

        // Tính toán thống kê
        const completedCount = userProgress.filter(
          (p) => p.progress === 'completed',
        ).length;
        const inProgressCount = userProgress.filter(
          (p) => p.progress === 'in_progress',
        ).length;
        const totalLessons = allLessons.length;
        const completionPercentage =
          totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0;

        // Xây dựng danh sách tiến độ học tập
        const lessonProgress: StudentLessonProgressDto[] = allLessons.map(
          (lesson) => {
            const progress = userProgress.find((p) => p.lessonId === lesson.id);
            const chapter = chapters.find((ch) =>
              ch.lessons.some((l) => l.id === lesson.id),
            );

            return {
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              progress: progress?.progress || 'not_started',
              chapterTitle: chapter?.title || 'Unknown',
            };
          },
        );

        return {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          avatarUrl: user.avatarUrl || undefined,
          country: user.country,
          status: user.status,
          createdAt: user.createdAt,
          lessonProgress,
          totalLessons,
          completedLessons: completedCount,
          inProgressLessons: inProgressCount,
          completionPercentage,
        };
      });

    // Áp dụng phân trang
    const skip = (page - 1) * limit;
    const paginatedStudents = studentsWithProgress.slice(skip, skip + limit);

    return {
      courseId,
      courseName: course.title,
      students: paginatedStudents,
      totalStudents: studentsWithProgress.length,
    };
  }

  /**
   * Lấy thống kê tổng quát học sinh của một khóa học
   */
  async getCourseStudentStats(
    teacherId: string,
    courseId: string,
  ): Promise<CourseStudentStatsDto> {
    // Xác thực rằng khóa học thuộc về giáo viên
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Khóa học với ID ${courseId} không tồn tại`);
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
    }

    // Lấy tất cả học sinh đã mua khóa học
    const orders = await this.prisma.order.findMany({
      where: {
        courseId: courseId,
        status: 'success',
      },
    });

    const userIds = orders.map((order) => order.userId);
    const totalStudents = userIds.length;

    // Lấy các bài học của khóa học
    const allLessons = await this.prisma.lesson.findMany({
      where: {
        chapter: {
          courseId: courseId,
        },
      },
      select: {
        id: true,
      },
    });

    const lessonIds = allLessons.map((lesson) => lesson.id);

    if (totalStudents === 0 || lessonIds.length === 0) {
      return {
        totalStudents: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        averageCompletionPercentage: 0,
      };
    }

    // Lấy tiến độ của tất cả học sinh
    const allProgress = await this.prisma.userLessonProgress.findMany({
      where: {
        userId: {
          in: userIds,
        },
        lessonId: {
          in: lessonIds,
        },
      },
    });

    // Tính thống kê cho mỗi học sinh
    const studentStats = userIds.map((userId) => {
      const userProgress = allProgress.filter((p) => p.userId === userId);
      const completedCount = userProgress.filter(
        (p) => p.progress === 'completed',
      ).length;
      const completionPercentage =
        lessonIds.length > 0 ? (completedCount / lessonIds.length) * 100 : 0;
      return completionPercentage;
    });

    // Đếm học sinh theo trạng thái hoàn thành
    const completedCount = userIds.filter((userId) => {
      const userProgress = allProgress.filter((p) => p.userId === userId);
      return userProgress.every((p) => p.progress === 'completed');
    }).length;

    const inProgressCount = userIds.filter((userId) => {
      const userProgress = allProgress.filter((p) => p.userId === userId);
      return (
        userProgress.some((p) => p.progress === 'in_progress') &&
        !userProgress.every((p) => p.progress === 'completed')
      );
    }).length;

    const notStartedCount = totalStudents - completedCount - inProgressCount;

    const averageCompletionPercentage =
      studentStats.length > 0
        ? Math.round(
            studentStats.reduce((sum, pct) => sum + pct, 0) /
              studentStats.length,
          )
        : 0;

    return {
      totalStudents,
      completedCount,
      inProgressCount,
      notStartedCount,
      averageCompletionPercentage,
    };
  }
}
