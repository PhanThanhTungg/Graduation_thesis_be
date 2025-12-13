import { Controller, Get, Param, UseGuards, Patch, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ClientSettingService } from './client-setting.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { UpdateSprSettingDto } from './dto/update-spr-setting.dto';

@ApiTags('Client Setting')
@ApiBearerAuth()
@Controller('/setting')
@UseGuards(AuthGuard('client-jwt'), ClientRoleGuard)
export class ClientSettingController {
  constructor(private readonly clientSettingService: ClientSettingService) {}

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
