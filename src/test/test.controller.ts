import { Controller, Get, UseGuards, Post } from '@nestjs/common';
import { LoggingService } from '../shared/logging/logging.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/common/enums/common.enum';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import {
  UniversalAuthGuard,
  UniversalAuth,
} from 'src/common/guards/universal-auth.guard';
import { InsertRolePermissionJob } from 'src/jobs/insert-role-permission.job';

@Controller('test')
export class TestController {
  constructor(
    private readonly loggingService: LoggingService,
    private readonly insertRolePermissionJob: InsertRolePermissionJob,
  ) {}

  // Test logging
  @Get('slow')
  async getSlow() {
    await new Promise((resolve) => setTimeout(resolve, 1500));
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

  // Test universal auth
  @Get('universal-auth')
  @ApiBearerAuth()
  @UseGuards(UniversalAuthGuard)
  async getUniversalAuth(@CurrentUser() user: any) {
    return {
      message: 'Universal auth successful',
      user: user,
      userType: user.permissions ? 'admin' : 'client',
    };
  }

  // Test universal auth with decorator // basic auth guard
  @Get('universal-auth-decorator')
  @ApiBearerAuth()
  @UniversalAuth()
  async getUniversalAuthDecorator(@CurrentUser() user: any) {
    return {
      message: 'Universal auth decorator successful',
      user: user,
      userType: user.permissions ? 'admin' : 'client',
    };
  }

  @Post('insert-admin-permissions')
  async insertAdminPermissions() {
    await this.insertRolePermissionJob.execute();
    return { message: 'Admin permissions inserted successfully' };
  }
}
