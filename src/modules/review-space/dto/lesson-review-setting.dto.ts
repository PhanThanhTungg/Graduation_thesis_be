import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Difficulty, LessonReviewStatus } from '@prisma/client';

export class LessonReviewSettingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewEnabled: boolean;

  @ApiProperty()
  easinessFactor: number;

  @ApiProperty()
  interval: number;

  @ApiProperty({ enum: LessonReviewStatus })
  status: LessonReviewStatus;

  @ApiProperty()
  reviewStep: number;

  @ApiProperty()
  lapsed: number;

  @ApiPropertyOptional()
  lastReviewedAt: Date | null;

  @ApiPropertyOptional()
  note: string | null;

  @ApiProperty({ enum: Difficulty })
  difficulty: Difficulty;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  lessonTitle: string;

  @ApiProperty()
  courseTitle: string;

  @ApiProperty()
  courseId: string;

  @ApiProperty()
  chapterId: string;

  @ApiProperty()
  chapterTitle: string;

  @ApiProperty()
  courseSlug: string;

  @ApiProperty()
  lessonSlug: string;
}
