import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminPermissionGuard } from 'src/common/guards/admin-permission.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { AdminObject, AdminAction } from '@prisma/client';
import { AdminAnalyticsService } from './admin-analytics.service';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { GetAnalyticsResponseDto } from './dto/get-analytics-response.dto';

@ApiTags('Admin - Analytics')
@Controller('admin/analytics')
@UseGuards(AuthGuard('admin-jwt'), AdminPermissionGuard)
@ApiBearerAuth()
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get analytics data by date range' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date (YYYY-MM-DD). If today, will include real-time data',
    example: '2026-01-07',
  })
  @RequirePermissions({
    object: AdminObject.dashboard,
    action: AdminAction.view,
  })
  async getAnalytics(
    @Query() query: GetAnalyticsQueryDto,
  ): Promise<GetAnalyticsResponseDto> {
    return this.adminAnalyticsService.getAnalytics(
      query.startDate,
      query.endDate,
    );
  }
}
