import { Controller, Get,UseGuards } from '@nestjs/common';
import { LoggingService } from '../shared/logging/logging.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/common/enums/common.enum';
import { ClientRoleGuard, ClientRoles } from 'src/common/guards/client-role.guard';

@Controller('test')
export class TestController {
  constructor(
    private readonly loggingService: LoggingService,
  ) {}

  // Test logging
  @Get('slow')
  async getSlow() {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { message: 'Slow request completed' };
  }

  // Test decorator
  // get current client user
  @Get('current-user')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('client-jwt'))
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  // get current admin user
  @Get('current-admin')
  @UseGuards(AuthGuard('admin-jwt'))
  @ApiBearerAuth()
  async getCurrentAdmin(@CurrentUser() user: any) {
    return user;
  }

  @Get('role-teacher')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('client-jwt'), ClientRoleGuard)
  @ClientRoles(UserRole.teacher)
  async getRoleTeacher(@CurrentUser() user: any) {
    return user;
  }
}