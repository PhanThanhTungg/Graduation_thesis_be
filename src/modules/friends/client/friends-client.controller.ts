import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/common/interfaces/response.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { FriendsClientService } from './friends-client.service';
import { AddFriendRequestDto } from './dto/add-friend-request.dto';

@ApiTags('Client Friends')
@Controller('friends')
@UseGuards(AuthGuard('client-jwt'), ClientRoleGuard)
@ApiBearerAuth()
export class FriendsClientController {
  constructor(private readonly friendsClientService: FriendsClientService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search friends by name' })
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
  async searchFriends(
    @Query('keySearch') keySearch: string,
    @Query('limit') limit?: string,
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.searchFriends(
      keySearch,
      currentUser?.id || '',
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post('request')
  @ApiOperation({ summary: 'Send a friend request' })
  async addFriendRequest(
    @Body() addFriendRequestDto: AddFriendRequestDto,
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.addFriendRequest(
      currentUser?.id || '',
      addFriendRequestDto.friendId,
    );
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get friend requests (pending)' })
  async getFriendRequests(
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.getFriendRequests(currentUser?.id || '');
  }

  @Get('accepted')
  @ApiOperation({ summary: 'Get accepted friends' })
  async getAcceptedFriends(
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.getAcceptedFriends(currentUser?.id || '');
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get sent friend requests' })
  async getSentFriendRequests(
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.getSentFriendRequests(
      currentUser?.id || '',
    );
  }

  @Delete('request/:friendId')
  @ApiOperation({ summary: 'Cancel a friend request' })
  @ApiParam({
    name: 'friendId',
    description: 'Friend ID to cancel request',
  })
  async cancelFriendRequest(
    @Param('friendId') friendId: string,
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.cancelFriendRequest(
      currentUser?.id || '',
      friendId,
    );
  }

  @Patch('request/:friendId/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({
    name: 'friendId',
    description: 'Friend ID to accept request',
  })
  async acceptFriendRequest(
    @Param('friendId') friendId: string,
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.acceptFriendRequest(
      currentUser?.id || '',
      friendId,
    );
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Unfriend a user' })
  @ApiParam({
    name: 'friendId',
    description: 'Friend ID to unfriend',
  })
  async unfriend(
    @Param('friendId') friendId: string,
    @CurrentUser() currentUser?: currentClientUser,
  ): Promise<successResponse> {
    return this.friendsClientService.unfriend(currentUser?.id || '', friendId);
  }
}
