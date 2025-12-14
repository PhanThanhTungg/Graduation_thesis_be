import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsClientService } from './analytics-client.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import {
  GetAnalyticsDto,
  GetAnalyticsHistoryDto,
  GetChartDataDto,
  GetCourseRatingHistoryDto,
} from './dto/get-analytics.dto';

@Controller('analytics/client')
@ApiTags('Client / Analytics')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class AnalyticsClientController {
  constructor(private readonly analyticsService: AnalyticsClientService) {}

  @Get('current')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Get current real-time analytics data for teacher dashboard',
  })
  async getCurrentAnalytics(
    @Query() dto: GetAnalyticsDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.analyticsService.getCurrentAnalytics(dto, user);
  }

  @Get('by-date')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary:
      'Get analytics by date - returns real-time for today, historical for past dates',
  })
  async getAnalyticsByDate(
    @Query() dto: GetAnalyticsDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.analyticsService.getAnalyticsByDate(dto, user);
  }

  @Get('history')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Get historical analytics data for a date range',
  })
  async getAnalyticsHistory(
    @Query() dto: GetAnalyticsHistoryDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.analyticsService.getAnalyticsHistory(dto, user);
  }

  @Get('chart')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Get chart data for orders/revenue over time',
  })
  async getChartData(
    @Query() dto: GetChartDataDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.analyticsService.getChartData(dto, user);
  }

  @Get('top-courses')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Get top 5 courses by revenue for the teacher',
  })
  async getTopCourses(@CurrentUser() user: currentClientUser) {
    return this.analyticsService.getTopCourses(user);
  }

  @Get('students-by-country')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Get students distribution by country',
  })
  async getStudentsByCountry(@CurrentUser() user: currentClientUser) {
    return this.analyticsService.getStudentsByCountry(user);
  }

  @Get('course-rating-history')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({
    summary: 'Get rating and review history for a specific course',
  })
  async getCourseRatingHistory(
    @Query() dto: GetCourseRatingHistoryDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.analyticsService.getCourseRatingHistory(dto.courseId, dto, user);
  }
}
