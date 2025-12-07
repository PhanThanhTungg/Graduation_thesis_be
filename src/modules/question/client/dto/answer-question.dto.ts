import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Model } from './generate.dto';

export class AnswerQuestionDto {
  @IsNotEmpty({ message: 'Answer is required' })
  @ApiProperty({
    description: 'Answer of question',
    example: 'Answer of question',
  })
  answer: string;

  @ApiProperty({
    description: 'Model of AI',
    enum: Model,
    default: Model.GROQ,
  })
  @IsEnum(Model)
  model: Model;
}
