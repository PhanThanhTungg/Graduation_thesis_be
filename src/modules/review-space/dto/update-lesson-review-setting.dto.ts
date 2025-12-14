import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateLessonReviewSettingDto {
  @ApiPropertyOptional({
    description: 'Enable or disable review',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  reviewEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Note for the lesson review',
    example: 'Need to focus on this lesson',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
