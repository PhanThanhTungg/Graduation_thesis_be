import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AiModel } from '@prisma/client';

export class AnswerQuestionDto {
  @IsNotEmpty({ message: 'Answer is required' })
  @ApiProperty({
    description: 'Answer of question',
    example: 'Answer of question',
  })
  answer: string;

  @ApiProperty({
    description: 'Model of AI',
    enum: AiModel,
    default: AiModel.groq,
  })
  @IsEnum(AiModel)
  model: AiModel;
}
