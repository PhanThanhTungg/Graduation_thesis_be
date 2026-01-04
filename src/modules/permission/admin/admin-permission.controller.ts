import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { successResponse } from 'src/common/interfaces/response.interface';
import { AdminPermissionService } from './admin-permission.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('Admin - Account, Permission & Role')
@Controller('admin')
@UseGuards(AuthGuard('admin-jwt'))
@ApiBearerAuth()
export class AdminPermissionController {
  constructor(
    private readonly adminPermissionService: AdminPermissionService,
  ) {}

  @Get('permission')
  @ApiOperation({ summary: 'Get all permissions from database' })
  async getAllPermissions(): Promise<successResponse> {
    return this.adminPermissionService.getAllPermissions();
  }

  @Get('role')
  @ApiOperation({ summary: 'Get all roles with their permissions' })
  async getAllRoles(): Promise<successResponse> {
    return this.adminPermissionService.getAllRoles();
  }

  @Get('role/:id')
  @ApiOperation({ summary: 'Get a role by ID with its permissions' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  async getRoleById(@Param('id') id: string): Promise<successResponse> {
    return this.adminPermissionService.getRoleById(id);
  }

  @Post('role')
  @ApiOperation({ summary: 'Create a new role with permissions' })
  async createRole(
    @Body() createRoleDto: CreateRoleDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.createRole(createRoleDto);
  }

  @Patch('role/:id')
  @ApiOperation({ summary: 'Update a role and its permissions' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.updateRole(id, updateRoleDto);
  }

  @Delete('role/:id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  async deleteRole(@Param('id') id: string): Promise<successResponse> {
    return this.adminPermissionService.deleteRole(id);
  }

  @Get('account')
  @ApiOperation({ summary: 'Get all admin accounts with their roles' })
  async getAllAdmins(): Promise<successResponse> {
    return this.adminPermissionService.getAllAdmins();
  }

  @Post('account')
  @ApiOperation({ summary: 'Create a new admin account' })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.createAdmin(createAdminDto);
  }

  @Patch('account/:id')
  @ApiOperation({ summary: 'Update an admin account' })
  @ApiParam({ name: 'id', type: String, description: 'Admin ID' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ): Promise<successResponse> {
    return this.adminPermissionService.updateAdmin(id, updateAdminDto);
  }

  @Delete('account/:id')
  @ApiOperation({ summary: 'Delete an admin account' })
  @ApiParam({ name: 'id', type: String, description: 'Admin ID' })
  async deleteAdmin(@Param('id') id: string): Promise<successResponse> {
    return this.adminPermissionService.deleteAdmin(id);
  }
}
