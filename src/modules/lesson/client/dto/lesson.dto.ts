import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, ValidateNested, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { LessonProgress } from '@prisma/client';

export class FileDto {
  @ApiProperty({ description: 'File URL' })
  @IsString()
  fileUrl: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  fileSize: number;
}

export class CreateLessonDto {
  @ApiProperty({ description: 'Lesson title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Lesson description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Video ID' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({ description: 'Embed URL' })
  @IsOptional()
  @IsString()
  embedUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: 'Files', type: [FileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];

  @ApiPropertyOptional({ description: 'Allow preview for non-enrolled students', default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
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

  @ApiPropertyOptional({ description: 'Video ID' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({ description: 'Embed URL' })
  @IsOptional()
  @IsString()
  embedUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Files', type: [FileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDto)
  files?: FileDto[];

  @ApiPropertyOptional({ description: 'Allow preview for non-enrolled students', default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
}

export class UpdateLessonProgressDto {
  @ApiProperty({ description: 'Lesson progress status', enum: LessonProgress })
  @IsEnum(LessonProgress)
  progress: LessonProgress;
}

export class LessonDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  duration?: number | null;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  chapterId: string;
}

export class LessonTreeItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  position: number;

  @ApiProperty()
  isFree: boolean;

  @ApiProperty()
  viewCount: number;

  @ApiPropertyOptional()
  videoLesson?: {
    videoId: string;
    embedUrl: string;
    duration: number | null;
  } | null;

  @ApiProperty({ enum: LessonProgress })
  progress: LessonProgress;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  updatedAt?: Date | null;
}

export class ChapterWithLessonsTreeItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  parentId?: string | null;

  @ApiProperty({ type: [LessonTreeItemDto] })
  lessons: LessonTreeItemDto[];

  @ApiProperty({ type: () => [ChapterWithLessonsTreeItemDto] })
  children: ChapterWithLessonsTreeItemDto[] = [];
}

