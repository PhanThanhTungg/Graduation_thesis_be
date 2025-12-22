import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';
import { Difficulty, TypeQuestion } from '@prisma/client';

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

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: Difficulty,
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;

  @ApiPropertyOptional({
    description: 'Question type',
    enum: TypeQuestion,
    example: 'single_choice',
  })
  @IsOptional()
  @IsEnum(TypeQuestion)
  typeQues?: TypeQuestion;
}
