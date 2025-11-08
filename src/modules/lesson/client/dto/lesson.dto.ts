import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LessonType } from '@prisma/client';

export class CreateLessonDto {
  @ApiProperty({ description: 'Lesson title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Lesson type', enum: LessonType })
  @IsEnum(LessonType)
  type: LessonType;

  @ApiPropertyOptional({ description: 'Video ID (for video type)' })
  @IsOptional()
  @IsString()
  videoId?: string;


  @ApiPropertyOptional({ description: 'Embed URL (for video type)' })
  @IsOptional()
  @IsString()
  embedUrl?: string;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({ description: 'Lesson title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Lesson type', enum: LessonType })
  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @ApiPropertyOptional({ description: 'Video ID (for video type)' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({ description: 'Embed URL (for video type)' })
  @IsOptional()
  @IsString()
  embedUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  duration?: number;
}

export class LessonDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ enum: LessonType })
  type: LessonType;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  duration?: number | null;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  chapterId: string;
}

