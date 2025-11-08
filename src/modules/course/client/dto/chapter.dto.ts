import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChapterDto {
  @ApiProperty({ description: 'Chapter title' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Chapter description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent chapter id' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ChapterTreeItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ required: false })
  description?: string | null;

  @ApiProperty()
  position: number;

  @ApiProperty({ required: false })
  parentId?: string | null;

  @ApiProperty({ type: () => [ChapterTreeItemDto] })
  children: ChapterTreeItemDto[] = [];
}

