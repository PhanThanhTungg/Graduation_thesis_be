import { ApiProperty } from '@nestjs/swagger';
import { AiModel, SprBot } from '@prisma/client';

export class SprSettingDto {
  @ApiProperty()
  telegramId: string | null;

  @ApiProperty()
  discordId: string | null;

  @ApiProperty({ enum: SprBot })
  sprBot: SprBot;

  @ApiProperty({ enum: AiModel })
  sprModel: AiModel;

  @ApiProperty()
  sprInterval: number;

  @ApiProperty()
  enabledSpr: boolean;
}
