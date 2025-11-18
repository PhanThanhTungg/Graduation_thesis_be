import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}

export class ChatResponseDto {
  @IsString()
  response: string;

  @IsString()
  model: string;

  @IsOptional()
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

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