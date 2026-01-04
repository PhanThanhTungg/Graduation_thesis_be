import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminObject, AdminAction } from '@prisma/client';
import { AdminPermissionGuard } from 'src/common/guards/admin-permission.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { successResponse } from 'src/common/interfaces/response.interface';
import { UserRole } from 'src/common/enums/common.enum';
import { AdminUserService } from './admin-user.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Admin - User')
@Controller('admin/user')
@UseGuards(AuthGuard('admin-jwt'), AdminPermissionGuard)
@ApiBearerAuth()
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination, search and filter' })
  @ApiQuery({
    name: 'keySearch',
    required: false,
    description: 'Search by full name or email',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @RequirePermissions({ object: AdminObject.user, action: AdminAction.view })
  async getAllUsers(
    @Query('keySearch') keySearch?: string,
    @Query('role') role?: UserRole,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<successResponse> {
    return this.adminUserService.getAllUsers({
      keySearch,
      role,
      sortField,
      sortOrder,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':userId')
  @ApiOperation({
    summary:
      'Get user detail by ID (includes teacherSettings and courses for teachers)',
  })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @RequirePermissions({ object: AdminObject.user, action: AdminAction.view })
  async getUserById(@Param('userId') userId: string): Promise<successResponse> {
    return this.adminUserService.getUserById(userId);
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @RequirePermissions({ object: AdminObject.user, action: AdminAction.edit })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ): Promise<successResponse> {
    return this.adminUserService.updateUserStatus(
      userId,
      updateStatusDto.status,
    );
  }
}
