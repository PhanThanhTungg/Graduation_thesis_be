import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';

export class UpdateAdminSettingDto {
  @ApiPropertyOptional({
    description: 'Web title',
    example: 'Aikabis LMS',
  })
  @IsOptional()
  @IsString()
  webTitle?: string;

  @ApiPropertyOptional({
    description: 'Web favicon URL',
    example: 'https://example.com/favicon.ico',
  })
  @IsOptional()
  @IsString()
  webFavicon?: string;

  @ApiPropertyOptional({
    description: 'Web description',
    example: 'Learning Management System',
  })
  @IsOptional()
  @IsString()
  webDescription?: string;

  @ApiPropertyOptional({
    description: 'Web keywords',
    example: ['education', 'learning', 'lms'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  webKeywords?: string[];

  @ApiPropertyOptional({
    description: 'Web author',
    example: 'Aikabis Team',
  })
  @IsOptional()
  @IsString()
  webAuthor?: string;

  @ApiPropertyOptional({
    description: 'Web copyright',
    example: '© 2024 Aikabis. All rights reserved.',
  })
  @IsOptional()
  @IsString()
  webCopyright?: string;

  @ApiPropertyOptional({
    description: 'Learning steps in days',
    example: [0.000694, 0.00694, 1],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  learningSteps?: number[];

  @ApiPropertyOptional({
    description: 'Last step from learning to review',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  lastStepFromLearningToReview?: number;

  @ApiPropertyOptional({
    description: 'Initial interval',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  iniInterval?: number;

  @ApiPropertyOptional({
    description: 'Initial easy interval',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  iniEasyInterval?: number;

  @ApiPropertyOptional({
    description: 'Leech threshold',
    example: 8,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  leechThreshold?: number;
}
