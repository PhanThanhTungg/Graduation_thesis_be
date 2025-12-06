import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { Difficulty, TypeQuestion } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export enum Model {
  GROQ = 'groq',
  GEMINI = 'gemini',
}

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
    enum: Model,
    default: Model.GROQ,
  })
  @IsEnum(Model)
  model: Model = Model.GROQ;
}
