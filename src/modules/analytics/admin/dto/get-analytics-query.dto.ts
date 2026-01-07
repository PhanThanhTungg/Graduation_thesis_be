import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetAnalyticsQueryDto {
  @ApiProperty({
    description: 'Start date for analytics data (YYYY-MM-DD)',
    example: '2026-01-01',
    type: String,
  })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({
    description:
      'End date for analytics data (YYYY-MM-DD). If today, will query real-time data from database',
    example: '2026-01-07',
    type: String,
  })
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}
