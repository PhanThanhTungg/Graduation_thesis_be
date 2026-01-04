import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { SprSettingDto } from '../../auth/client/dto/spr-setting.dto';
import { UpdateSprSettingDto } from './dto/update-spr-setting.dto';
import { LoggingService } from 'src/shared/logging/logging.service';

@Injectable()
export class ClientSettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getSettingsByType(
    type: string,
    userId: string,
  ): Promise<successResponse> {
    if (type === 'spr') {
      return this.getSprSettings(userId);
    }

    throw new BadRequestException(`Unknown setting type: ${type}`);
  }

  private async getSprSettings(userId: string): Promise<successResponse> {
    const studentSetting = await this.prisma.studentSetting.findUnique({
      where: { userId },
      select: {
        telegramId: true,
        discordId: true,
        sprBot: true,
        sprModel: true,
        sprInterval: true,
        enabledSpr: true,
      },
    });

    if (!studentSetting) {
      const defaultSetting: SprSettingDto = {
        telegramId: null,
        discordId: null,
        sprBot: 'telegram',
        sprModel: 'groq',
        sprInterval: 600,
        enabledSpr: false,
      };

      const response: successResponse = {
        message: 'SPR settings retrieved successfully',
        data: defaultSetting,
      };
      return response;
    }

    const sprSetting: SprSettingDto = {
      telegramId: studentSetting.telegramId,
      discordId: studentSetting.discordId,
      sprBot: studentSetting.sprBot,
      sprModel: studentSetting.sprModel,
      sprInterval: studentSetting.sprInterval ?? 600,
      enabledSpr: studentSetting.enabledSpr ?? false,
    };

    const response: successResponse = {
      message: 'SPR settings retrieved successfully',
      data: sprSetting,
    };
    return response;
  }

  async updateSettingsByType(
    type: string,
    updateDto: UpdateSprSettingDto,
    userId: string,
  ): Promise<successResponse> {
    if (type === 'spr') {
      return this.updateSprSettings(updateDto, userId);
    }

    throw new BadRequestException(`Unknown setting type: ${type}`);
  }

  async setTelegramId(telegramId: string, userId: string) {
    const updatedSetting = await this.prisma.studentSetting.upsert({
      where: { userId },
      create: { userId, telegramId },
      update: { telegramId },
    });
    return updatedSetting;
  }

  private async updateSprSettings(
    updateDto: UpdateSprSettingDto,
    userId: string,
  ): Promise<successResponse> {
    const updateData: {
      sprBot?: UpdateSprSettingDto['sprBot'];
      sprModel?: UpdateSprSettingDto['sprModel'];
      sprInterval?: number;
      enabledSpr?: boolean;
    } = {};

    if (updateDto.sprBot !== undefined) {
      updateData.sprBot = updateDto.sprBot;
    }
    if (updateDto.sprModel !== undefined) {
      updateData.sprModel = updateDto.sprModel;
    }
    if (updateDto.sprInterval !== undefined) {
      updateData.sprInterval = updateDto.sprInterval;
    }
    if (updateDto.enabledSpr !== undefined) {
      updateData.enabledSpr = updateDto.enabledSpr;
    }

    const updatedSetting = await this.prisma.studentSetting.upsert({
      where: { userId },
      create: {
        userId,
        sprBot: updateDto.sprBot ?? 'telegram',
        sprModel: updateDto.sprModel ?? 'groq',
        sprInterval: updateDto.sprInterval ?? 600,
        enabledSpr: updateDto.enabledSpr ?? false,
      },
      update: updateData,
      select: {
        telegramId: true,
        discordId: true,
        sprBot: true,
        sprModel: true,
        sprInterval: true,
        enabledSpr: true,
      },
    });

    const sprSetting: SprSettingDto = {
      telegramId: updatedSetting.telegramId,
      discordId: updatedSetting.discordId,
      sprBot: updatedSetting.sprBot,
      sprModel: updatedSetting.sprModel,
      sprInterval: updatedSetting.sprInterval ?? 600,
      enabledSpr: updatedSetting.enabledSpr ?? false,
    };

    const response: successResponse = {
      message: 'SPR settings updated successfully',
      data: sprSetting,
    };
    return response;
  }

  async getFeeUploadPer100Mb(): Promise<successResponse> {
    const adminSetting = await this.prisma.adminSetting.findFirst({
      select: {
        feeUploadPer100Mb: true,
      },
    });

    if (!adminSetting) {
      const response: successResponse = {
        message: 'Fee upload per 100MB retrieved successfully',
        data: {
          feeUploadPer100Mb: 0.1,
        },
      };
      return response;
    }

    const response: successResponse = {
      message: 'Fee upload per 100MB retrieved successfully',
      data: {
        feeUploadPer100Mb: adminSetting.feeUploadPer100Mb,
      },
    };
    return response;
  }
}
