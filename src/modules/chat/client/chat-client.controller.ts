import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { successResponse } from 'src/common/interfaces/response.interface';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { ChatClientService } from './chat-client.service';
import { CreateOrGetConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';

@ApiTags('Client Chat')
@Controller('chat')
@UseGuards(AuthGuard('client-jwt'), ClientRoleGuard)
@ApiBearerAuth()
export class ChatClientController {
  constructor(private readonly chatClientService: ChatClientService) {}

  @Post('conversation')
  @ApiOperation({ summary: 'Create or get conversation with a user' })
  async createOrGetConversation(
    @Body() createConversationDto: CreateOrGetConversationDto,
    @CurrentUser() currentUser: currentClientUser,
  ): Promise<successResponse> {
    return this.chatClientService.createOrGetConversation(
      currentUser.id,
      createConversationDto.userId,
    );
  }

  @Post('message')
  @ApiOperation({ summary: 'Send a message to a conversation' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() currentUser: currentClientUser,
  ): Promise<successResponse> {
    return this.chatClientService.sendMessage(
      currentUser.id,
      sendMessageDto.conversationId,
      sendMessageDto.message,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations of current user' })
  async getConversations(
    @CurrentUser() currentUser: currentClientUser,
  ): Promise<successResponse> {
    return this.chatClientService.getConversations(currentUser.id);
  }

  @Get('conversation/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages of a conversation' })
  async getMessages(
    @CurrentUser() currentUser: currentClientUser,
    @Param('conversationId') conversationId: string,
  ): Promise<successResponse> {
    return this.chatClientService.getMessages(currentUser.id, conversationId);
  }

  @Post('group')
  @ApiOperation({ summary: 'Create a new group conversation' })
  async createGroup(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() currentUser: currentClientUser,
  ): Promise<successResponse> {
    return this.chatClientService.createGroup(
      currentUser.id,
      createGroupDto.name,
      createGroupDto.userIds,
    );
  }

  @Get('conversation/:conversationId/members')
  @ApiOperation({ summary: 'Get members of a conversation' })
  async getConversationMembers(
    @Param('conversationId') conversationId: string,
    @CurrentUser() currentUser: currentClientUser,
  ): Promise<successResponse> {
    return this.chatClientService.getConversationMembers(
      currentUser.id,
      conversationId,
    );
  }

  @Delete('conversation/:conversationId/member')
  @ApiOperation({ summary: 'Remove a member from a group (admin only)' })
  async removeMember(
    @Param('conversationId') conversationId: string,
    @Body() removeMemberDto: RemoveMemberDto,
    @CurrentUser() currentUser: currentClientUser,
  ): Promise<successResponse> {
    return this.chatClientService.removeMember(
      currentUser.id,
      conversationId,
      removeMemberDto.userId,
    );
  }
}
