export class DailyAnalyticsDto {
  date: Date;
  revenue: number;
  platformFee: number;
  student: number;
  teacher: number;
}

export class OverviewAnalyticsDto {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  totalCourses: number;
  totalPlatformFee: number;
  revenueByCategory: Record<string, number>;
  top5TeachersByStudentCount: any[];
  top5CoursesByStudentCount: any[];
}

export class GetAnalyticsResponseDto {
  dailyAnalytics: DailyAnalyticsDto[];
  overview: OverviewAnalyticsDto;
}
