import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { StudentService } from './student.service';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { UserRole } from 'src/common/enums/common.enum';
import {
  GetStudentsOfCourseDto,
  GetStudentsOfCourseResponseDto,
  CourseStudentStatsDto,
} from './dto/student.dto';
import { successResponse } from 'src/common/interfaces/response.interface';

@Controller('teacher/students')
@ApiTags('Client / Student')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('course/:courseId')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Lấy danh sách học sinh của một khóa học',
    description: `
      Lấy danh sách học sinh đã mua khóa học cùng với:
      - Thông tin cá nhân (tên, email, ảnh đại diện, quốc gia, trạng thái)
      - Tiến độ học tập chi tiết cho từng bài học
      - Thống kê tiến độ (số bài đã hoàn thành, đang học, chưa bắt đầu, phần trăm hoàn thành)
      
      Hỗ trợ:
      - Phân trang (page, limit)
      - Tìm kiếm theo tên hoặc email (search)
      - Lọc theo tiến độ (progressFilter)
    `,
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID của khóa học',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Số trang (mặc định: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số lượng học sinh trên một trang (mặc định: 20)',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Tìm kiếm theo tên hoặc email',
    type: String,
  })
  @ApiQuery({
    name: 'progressFilter',
    required: false,
    description: 'Lọc theo tiến độ (not_started, in_progress, completed)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách học sinh của khóa học',
    type: GetStudentsOfCourseResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập khóa học này',
  })
  @ApiResponse({
    status: 404,
    description: 'Khóa học không tồn tại',
  })
  async getStudentsOfCourse(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('progressFilter') progressFilter?: string,
    @CurrentUser() user?: currentClientUser,
  ): Promise<successResponse> {
    if (!user || user.role !== UserRole.teacher) {
      throw new BadRequestException('Only teachers can access this');
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }

    const data = await this.studentService.getStudentsOfCourse(
      user.id,
      courseId,
      pageNum,
      limitNum,
      search,
      progressFilter,
    );

    return {
      message: 'Get students successfully',
      data,
    };
  }

  @Get('course/:courseId/stats')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Lấy thống kê tổng quát học sinh của một khóa học',
    description: `
      Lấy các thống kê sau:
      - Tổng số học sinh
      - Số học sinh đã hoàn thành khóa học
      - Số học sinh đang học
      - Số học sinh chưa bắt đầu
      - Phần trăm hoàn thành trung bình
    `,
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID của khóa học',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê học sinh của khóa học',
    type: CourseStudentStatsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập khóa học này',
  })
  @ApiResponse({
    status: 404,
    description: 'Khóa học không tồn tại',
  })
  async getCourseStudentStats(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: currentClientUser,
  ): Promise<successResponse> {
    if (!user || user.role !== UserRole.teacher) {
      throw new BadRequestException('Only teachers can access this');
    }

    const data = await this.studentService.getCourseStudentStats(
      user.id,
      courseId,
    );

    return {
      message: 'Get student stats successfully',
      data,
    };
  }
}
