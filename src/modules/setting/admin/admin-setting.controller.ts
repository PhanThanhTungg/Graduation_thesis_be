import { Controller, Get, UseGuards, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminSettingService } from './admin-setting.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';

@ApiTags('Admin - Setting')
@ApiBearerAuth()
@Controller('admin/setting')
@UseGuards(AuthGuard('admin-jwt'))
export class AdminSettingController {
  constructor(private readonly adminSettingService: AdminSettingService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin settings' })
  async getSettings() {
    return this.adminSettingService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update admin settings' })
  async updateSettings(@Body() updateDto: UpdateAdminSettingDto) {
    return this.adminSettingService.updateSettings(updateDto);
  }
}
