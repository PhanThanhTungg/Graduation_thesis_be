import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AiModel, Difficulty, TypeQuestion } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateQuestionsDto {
  @ApiProperty({ description: 'The type of question', enum: TypeQuestion })
  @IsEnum(TypeQuestion)
  typeQuestion: TypeQuestion;

  @ApiProperty({ description: 'The difficulty of question', enum: Difficulty })
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @ApiProperty({ description: 'The total number of question' })
  @IsInt()
  @Min(1)
  totalQuestion: number;

  @ApiProperty({
    description: 'The model of AI',
    enum: AiModel,
    default: AiModel.groq,
  })
  @IsEnum(AiModel)
  model: AiModel = AiModel.groq;

  @ApiProperty({
    description: 'Is for review',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isForReview?: boolean = false;
}
