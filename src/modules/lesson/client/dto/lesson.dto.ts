import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength, ValidateNested, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({ description: 'Allow preview for non-enrolled students', default: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;
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

