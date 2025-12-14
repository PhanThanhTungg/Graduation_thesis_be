import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString, IsNotEmpty } from 'class-validator';

export class GetAnalyticsDto {
  @ApiPropertyOptional({
    description: 'The date to get analytics for (YYYY-MM-DD). Defaults to today',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Timezone for the analytics data',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class GetAnalyticsHistoryDto {
  @ApiProperty({
    description: 'Start date for analytics history (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for analytics history (YYYY-MM-DD)',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Timezone for the analytics data',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class GetChartDataDto {
  @ApiPropertyOptional({
    description: 'Time range: 7d, 30d, 90d. Defaults to 90d',
    enum: ['7d', '30d', '90d'],
  })
  @IsOptional()
  @IsString()
  timeRange?: '7d' | '30d' | '90d';

  @ApiPropertyOptional({
    description: 'Timezone for the chart data',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class GetCourseRatingHistoryDto {
  @ApiProperty({
    description: 'Course ID to get rating history for',
  })
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Time range: 7d, 30d, 90d. Defaults to 90d',
    enum: ['7d', '30d', '90d'],
  })
  @IsOptional()
  @IsString()
  timeRange?: '7d' | '30d' | '90d';

  @ApiPropertyOptional({
    description: 'Timezone for the chart data',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}
