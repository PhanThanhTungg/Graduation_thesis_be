import {
  Controller,
  Get,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProfileService } from './client-profile.service';
import { UpdateClientProfileDto } from './dto/client-profile.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Client Profile')
@ApiBearerAuth()
@Controller('/profile')
@UseGuards(AuthGuard('client-jwt'))
export class ClientProfileController {
  constructor(private readonly clientProfileService: ClientProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: any): Promise<any> {
    return user;
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateClientProfileDto,
  ): Promise<any> {
    return this.clientProfileService.updateProfile(user, updateDto);
  }
}
