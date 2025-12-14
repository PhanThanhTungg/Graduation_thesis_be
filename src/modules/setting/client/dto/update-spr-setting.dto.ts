import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AiModel, SprBot } from '@prisma/client';

export class UpdateSprSettingDto {
  @ApiPropertyOptional({
    description: 'SPR Bot type',
    enum: SprBot,
    example: 'telegram',
  })
  @IsOptional()
  @IsEnum(SprBot)
  sprBot?: SprBot;

  @ApiPropertyOptional({
    description: 'AI Model for SPR',
    enum: AiModel,
    example: 'groq',
  })
  @IsOptional()
  @IsEnum(AiModel)
  sprModel?: AiModel;

  @ApiPropertyOptional({
    description: 'Review interval in seconds',
    example: 600,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  sprInterval?: number;

  @ApiPropertyOptional({
    description: 'Enable spaced repetition',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabledSpr?: boolean;
}
