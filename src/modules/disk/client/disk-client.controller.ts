import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { DiskClientService } from './disk-client.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { PurchaseDiskSpaceDto } from './dto/purchase-disk-space.dto';
import { GetDiskPurchaseHistoryDto } from './dto/get-disk-purchase-history.dto';

@Controller('disk/client')
@ApiTags('Client / Disk')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class DiskClientController {
  constructor(private readonly diskService: DiskClientService) {}

  @Get('space')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get disk space information for teacher' })
  async getDiskSpace(@CurrentUser() user: currentClientUser) {
    return this.diskService.getDiskSpace(user);
  }

  @Get('purchase-history')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get disk purchase history for teacher' })
  async getDiskPurchaseHistory(
    @Query() dto: GetDiskPurchaseHistoryDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.diskService.getDiskPurchaseHistory(dto, user);
  }

  @Post('purchase')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Purchase disk space' })
  async purchaseDiskSpace(
    @Body() dto: PurchaseDiskSpaceDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.diskService.purchaseDiskSpace(dto, user);
  }
}
