import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';
import { AdminPermissionService } from './admin-permission.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Admin - Account, Permission & Role')
@Controller('admin')
@UseGuards(AuthGuard('admin-jwt'), AdminPermissionGuard)
@ApiBearerAuth()
export class AdminPermissionController {
  constructor(
    private readonly adminPermissionService: AdminPermissionService,
  ) {}

  @Get('permission')
  @ApiOperation({ summary: 'Get all permissions from database' })
  @RequirePermissions({
    object: AdminObject.permission,
    action: AdminAction.view,
  })
  async getAllPermissions(): Promise<successResponse> {
    return this.adminPermissionService.getAllPermissions();
  }

  @Get('role')
  @ApiOperation({ summary: 'Get all roles with their permissions' })
  @RequirePermissions({
    object: AdminObject.permission,
    action: AdminAction.view,
  })
  async getAllRoles(): Promise<successResponse> {
    return this.adminPermissionService.getAllRoles();
  }

  @Get('role/:id')
  @ApiOperation({ summary: 'Get a role by ID with its permissions' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @RequirePermissions({
    object: AdminObject.permission,
    action: AdminAction.view,
  })
  async getRoleById(@Param('id') id: string): Promise<successResponse> {
    return this.adminPermissionService.getRoleById(id);
  }

  @Post('role')
  @ApiOperation({ summary: 'Create a new role with permissions' })
  @RequirePermissions({
    object: AdminObject.permission,
    action: AdminAction.create,
  })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.createRole(createRoleDto);
  }

  @Patch('role/:id')
  @ApiOperation({ summary: 'Update a role and its permissions' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @RequirePermissions({
    object: AdminObject.permission,
    action: AdminAction.edit,
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.updateRole(id, updateRoleDto);
  }

  @Delete('role/:id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @RequirePermissions({
    object: AdminObject.permission,
    action: AdminAction.delete,
  })
  async deleteRole(@Param('id') id: string): Promise<successResponse> {
    return this.adminPermissionService.deleteRole(id);
  }

  @Get('account')
  @ApiOperation({
    summary: 'Get all admin accounts with pagination, sort, and search',
  })
  @ApiQuery({
    name: 'keySearch',
    type: String,
    required: false,
    description: 'Search by admin full name or email',
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Field to sort by (e.g., fullName, email, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Sort order (asc or desc)',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page',
  })
  @RequirePermissions({ object: AdminObject.admin, action: AdminAction.view })
  async getAllAdmins(
    @Query() filter: fullObjectFilter,
  ): Promise<successResponse> {
    return this.adminPermissionService.getAllAdmins(filter);
  }

  @Post('account')
  @ApiOperation({ summary: 'Create a new admin account' })
  @RequirePermissions({ object: AdminObject.admin, action: AdminAction.create })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.createAdmin(createAdminDto);
  }

  @Patch('account/:id')
  @ApiOperation({ summary: 'Update an admin account' })
  @ApiParam({ name: 'id', type: String, description: 'Admin ID' })
  @RequirePermissions({ object: AdminObject.admin, action: AdminAction.edit })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.updateAdmin(id, updateAdminDto);
  }

  @Patch('account/:id/password')
  @ApiOperation({ summary: 'Change admin password' })
  @ApiParam({ name: 'id', type: String, description: 'Admin ID' })
  @RequirePermissions({ object: AdminObject.admin, action: AdminAction.edit })
  async changeAdminPassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.changeAdminPassword(
      id,
      changePasswordDto,
    );
  }

  @Delete('account/:id')
  @ApiOperation({ summary: 'Delete an admin account' })
  @ApiParam({ name: 'id', type: String, description: 'Admin ID' })
  @RequirePermissions({ object: AdminObject.admin, action: AdminAction.delete })
  async deleteAdmin(@Param('id') id: string): Promise<successResponse> {
    return this.adminPermissionService.deleteAdmin(id);
  }
}
