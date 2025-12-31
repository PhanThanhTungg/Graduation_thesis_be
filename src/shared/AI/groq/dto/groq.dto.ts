import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateTextRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  maxTokens?: number;

  @IsOptional()
  temperature?: number;
}

export class GenerateTextResponseDto {
  @IsString()
  text: string;

  @IsString()
  model: string;

  @IsOptional()
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
