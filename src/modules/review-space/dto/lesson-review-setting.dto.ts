import { ApiProperty } from '@nestjs/swagger';
import { LessonReviewStatus } from '@prisma/client';

export class LessonReviewSettingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reviewEnabled: boolean;

  @ApiProperty()
  easinessFactor: number;

  @ApiProperty()
  intervalDays: number;

  @ApiProperty({ enum: LessonReviewStatus })
  status: LessonReviewStatus;

  @ApiProperty()
  reviewStep: number;

  @ApiProperty()
  lapsed: number;

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
}
