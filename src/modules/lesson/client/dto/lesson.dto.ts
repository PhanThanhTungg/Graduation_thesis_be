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

  @ApiPropertyOptional({ description: 'Video URL (for video type)' })
  @IsOptional()
  @IsString()
  videoUrl?: string;
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

