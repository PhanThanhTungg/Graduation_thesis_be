import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

@ApiTags('Client User')
@Controller('user')
@UseGuards(AuthGuard('client-jwt'), ClientRoleGuard)
@ApiBearerAuth()
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

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
}
