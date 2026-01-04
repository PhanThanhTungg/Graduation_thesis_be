import { IsNotEmpty, IsString } from 'class-validator';

export class SprQuestionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
