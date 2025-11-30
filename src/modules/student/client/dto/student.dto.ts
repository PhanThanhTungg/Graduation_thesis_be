import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO cho thông tin học sinh cơ bản
export class StudentBasicInfoDto {
  @ApiProperty({ description: 'ID của học sinh' })
  id: string;

  @ApiProperty({ description: 'Tên đầy đủ của học sinh' })
  fullName: string;

  @ApiProperty({ description: 'Email của học sinh' })
  email: string;

  @ApiProperty({ description: 'Ảnh đại diện' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Quốc gia' })
  country: string;

  @ApiProperty({ description: 'Trạng thái người dùng' })
  status: string;

  @ApiProperty({ description: 'Ngày tạo tài khoản' })
  createdAt: Date;
}

// DTO cho tiến độ học tập của học sinh
export class StudentLessonProgressDto {
  @ApiProperty({ description: 'ID của bài học' })
  lessonId: string;

  @ApiProperty({ description: 'Tên bài học' })
  lessonTitle: string;

  @ApiProperty({
    description: 'Tiến độ của bài học (not_started, in_progress, completed)',
  })
  progress: string;

  @ApiProperty({ description: 'Chương chứa bài học này' })
  chapterTitle: string;
}

// DTO cho thông tin học sinh kèm tiến độ học tập
export class StudentWithProgressDto extends StudentBasicInfoDto {
  @ApiProperty({
    type: [StudentLessonProgressDto],
    description: 'Danh sách tiến độ học tập',
  })
  lessonProgress: StudentLessonProgressDto[];

  @ApiProperty({ description: 'Tổng số bài học' })
  totalLessons: number;

  @ApiProperty({ description: 'Số bài học đã hoàn thành' })
  completedLessons: number;

  @ApiProperty({ description: 'Số bài học đang học' })
  inProgressLessons: number;

  @ApiProperty({ description: 'Phần trăm hoàn thành' })
  completionPercentage: number;
}

// DTO cho response danh sách học sinh
export class GetStudentsOfCourseResponseDto {
  @ApiProperty({ description: 'ID của khóa học' })
  courseId: string;

  @ApiProperty({ description: 'Tên khóa học' })
  courseName: string;

  @ApiProperty({
    type: [StudentWithProgressDto],
    description: 'Danh sách học sinh của khóa học',
  })
  students: StudentWithProgressDto[];

  @ApiProperty({ description: 'Tổng số học sinh' })
  totalStudents: number;
}

// DTO cho query parameters
export class GetStudentsOfCourseDto {
  @ApiProperty({ description: 'ID của khóa học' })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ description: 'Trang (mặc định: 1)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng học sinh trên một trang (mặc định: 20)',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên hoặc email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo tiến độ (not_started, in_progress, completed)',
  })
  @IsOptional()
  @IsString()
  progressFilter?: string;
}

// DTO cho thống kê tổng quát học sinh của khóa học
export class CourseStudentStatsDto {
  @ApiProperty({ description: 'Tổng số học sinh' })
  totalStudents: number;

  @ApiProperty({ description: 'Số học sinh đã hoàn thành' })
  completedCount: number;

  @ApiProperty({ description: 'Số học sinh đang học' })
  inProgressCount: number;

  @ApiProperty({ description: 'Số học sinh chưa bắt đầu' })
  notStartedCount: number;

  @ApiProperty({ description: 'Phần trăm hoàn thành trung bình' })
  averageCompletionPercentage: number;
}
