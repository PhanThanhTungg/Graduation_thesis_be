import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

interface FileData {
  mimeType: string;
  data: string;
}

interface FileUri {
  fileUri: string;
  mimeType: string;
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

  @IsOptional()
  @IsArray()
  files?: (FileData | FileUri)[];
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
