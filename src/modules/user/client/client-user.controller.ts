import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/common/interfaces/response.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { ClientUserService } from './client-user.service';
import { OnlineStatusService } from './online-status.service';

@ApiTags('Client User')
@Controller('user')
@UseGuards(AuthGuard('client-jwt'), ClientRoleGuard)
@ApiBearerAuth()
export class ClientUserController {
  constructor(
    private readonly clientUserService: ClientUserService,
    private readonly onlineStatusService: OnlineStatusService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search users by name' })
  @ApiQuery({
    name: 'keySearch',
    required: true,
    description: 'Search by full name',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of results',
  })
  async searchUsers(
    @Query('keySearch') keySearch: string,
    @Query('limit') limit?: string,
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.clientUserService.searchUsers(
      keySearch,
      currentUser?.id,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Heartbeat to keep user online status' })
  async heartbeat(
    @CurrentUser() user: currentClientUser,
  ): Promise<successResponse> {
    await this.onlineStatusService.setUserOnline(user.id);
    return {
      message: 'Heartbeat received',
      data: { userId: user.id },
    };
  }

  @Get('online-status')
  @ApiOperation({
    summary: 'Get online status and last login time of multiple users',
  })
  @ApiQuery({
    name: 'userIds',
    required: true,
    description: 'Comma-separated list of user IDs',
  })
  async getUsersOnlineStatus(
    @Query('userIds') userIds: string,
  ): Promise<successResponse> {
    const userIdArray = userIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    const statusMap =
      await this.onlineStatusService.getUsersOnlineStatus(userIdArray);
    return {
      message: 'Get online status successfully',
      data: statusMap,
    };
  }
}
