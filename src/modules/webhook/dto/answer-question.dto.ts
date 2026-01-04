import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
