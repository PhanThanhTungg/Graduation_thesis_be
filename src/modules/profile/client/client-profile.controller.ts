import {
  Controller,
  Get,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClientProfileService } from './client-profile.service';
import { UpdateClientProfileDto, UpdateTeacherProfileDto } from './dto/client-profile.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { ClientRoleGuard, ClientRoles } from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';

@ApiTags('Client Profile')
@ApiBearerAuth()
@Controller('/profile')
@UseGuards(AuthGuard('client-jwt'), ClientRoleGuard )
export class ClientProfileController {
  constructor(private readonly clientProfileService: ClientProfileService) {}

  @ApiOperation({ summary: 'Get client profile // has teacherSetting' })
  @Get()
  async getProfile(@CurrentUser() user: currentClientUser): Promise<any> {
    return user;
  }

  @ApiOperation({ summary: 'Update client profile // just update user info' })
  @Patch()
  async updateProfile(
    @CurrentUser() user: currentClientUser,
    @Body() updateDto: UpdateClientProfileDto,
  ): Promise<any> {
    return this.clientProfileService.updateProfile(user, updateDto);
  }

  @ApiOperation({ summary: 'Update teacher profile // update teacherSetting' })
  @Patch('teacher')
  @ClientRoles(UserRole.teacher)
  async updateTeacherProfile(
    @CurrentUser() user: currentClientUser,
    @Body() updateDto: UpdateTeacherProfileDto,
  ): Promise<any> {
    return this.clientProfileService.updateTeacherProfile(user, updateDto);
  }
}
