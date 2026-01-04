import { Controller, Get, Param, UseGuards, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ClientSettingService } from './client-setting.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UpdateSprSettingDto } from './dto/update-spr-setting.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Client Setting')
@ApiBearerAuth()
@Controller('/setting')
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class ClientSettingController {
  constructor(private readonly clientSettingService: ClientSettingService) {}

  @Get('admin/fee-upload')
  @Public()
  @ApiOperation({ summary: 'Get fee upload per 100MB' })
  async getFeeUploadPer100Mb() {
    return this.clientSettingService.getFeeUploadPer100Mb();
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get settings by type' })
  @ApiParam({ name: 'type', description: 'Setting type (e.g., spr)' })
  async getSettingsByType(
    @Param('type') type: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.clientSettingService.getSettingsByType(type, user.id);
  }

  @Patch(':type')
  @ApiOperation({ summary: 'Update settings by type' })
  @ApiParam({ name: 'type', description: 'Setting type (e.g., spr)' })
  async updateSettingsByType(
    @Param('type') type: string,
    @Body() updateDto: UpdateSprSettingDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.clientSettingService.updateSettingsByType(
      type,
      updateDto,
      user.id,
    );
  }
}
