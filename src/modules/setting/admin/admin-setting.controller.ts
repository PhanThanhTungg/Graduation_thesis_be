import { Controller, Get, UseGuards, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminObject, AdminAction } from '@prisma/client';
import { AdminPermissionGuard } from 'src/common/guards/admin-permission.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { AdminSettingService } from './admin-setting.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';

@ApiTags('Admin - Setting')
@ApiBearerAuth()
@Controller('admin/setting')
@UseGuards(AuthGuard('admin-jwt'), AdminPermissionGuard)
export class AdminSettingController {
  constructor(private readonly adminSettingService: AdminSettingService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin settings' })
  @RequirePermissions({ object: AdminObject.setting, action: AdminAction.view })
  async getSettings() {
    return this.adminSettingService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update admin settings' })
  @RequirePermissions({ object: AdminObject.setting, action: AdminAction.edit })
  async updateSettings(@Body() updateDto: UpdateAdminSettingDto) {
    return this.adminSettingService.updateSettings(updateDto);
  }
}
