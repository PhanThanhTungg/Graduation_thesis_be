import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';
import { LoggingService } from 'src/shared/logging/logging.service';

@Injectable()
export class AdminSettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: LoggingService,
  ) {}

  async getSettings(): Promise<successResponse> {
    let settings = await this.prisma.adminSetting.findFirst();

    if (!settings) {
      settings = await this.prisma.adminSetting.create({
        data: {},
      });
    }

    const response: successResponse = {
      message: 'Admin settings retrieved successfully',
      data: settings,
    };
    return response;
  }

  async updateSettings(
    updateDto: UpdateAdminSettingDto,
  ): Promise<successResponse> {
    let settings = await this.prisma.adminSetting.findFirst();

    if (!settings) {
      settings = await this.prisma.adminSetting.create({
        data: {},
      });
    }

    const updateData: {
      webTitle?: string;
      webFavicon?: string;
      webDescription?: string;
      webKeywords?: string[];
      webAuthor?: string;
      webCopyright?: string;
      learningSteps?: number[];
      lastStepFromLearningToReview?: number;
      iniInterval?: number;
      iniEasyInterval?: number;
      leechThreshold?: number;
    } = {};

    if (updateDto.webTitle !== undefined)
      updateData.webTitle = updateDto.webTitle;
    if (updateDto.webFavicon !== undefined)
      updateData.webFavicon = updateDto.webFavicon;
    if (updateDto.webDescription !== undefined)
      updateData.webDescription = updateDto.webDescription;
    if (updateDto.webKeywords !== undefined)
      updateData.webKeywords = updateDto.webKeywords;
    if (updateDto.webAuthor !== undefined)
      updateData.webAuthor = updateDto.webAuthor;
    if (updateDto.webCopyright !== undefined)
      updateData.webCopyright = updateDto.webCopyright;
    if (updateDto.learningSteps !== undefined)
      updateData.learningSteps = updateDto.learningSteps;
    if (updateDto.lastStepFromLearningToReview !== undefined)
      updateData.lastStepFromLearningToReview =
        updateDto.lastStepFromLearningToReview;
    if (updateDto.iniInterval !== undefined)
      updateData.iniInterval = updateDto.iniInterval;
    if (updateDto.iniEasyInterval !== undefined)
      updateData.iniEasyInterval = updateDto.iniEasyInterval;
    if (updateDto.leechThreshold !== undefined)
      updateData.leechThreshold = updateDto.leechThreshold;

    const updatedSettings = await this.prisma.adminSetting.update({
      where: { id: settings.id },
      data: updateData,
    });

    const response: successResponse = {
      message: 'Admin settings updated successfully',
      data: updatedSettings,
    };
    return response;
  }
}
