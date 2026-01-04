import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminPermissionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all permissions from database
   */
  async getAllPermissions(): Promise<successResponse> {
    const permissions = await this.prisma.adminPermission.findMany({
      orderBy: [{ object: 'asc' }, { action: 'asc' }],
    });

    return {
      message: 'Get all permissions successfully',
      data: permissions,
    };
  }

  /**
   * Get all roles with their permissions
   */
  async getAllRoles(): Promise<successResponse> {
    const roles = await this.prisma.adminRole.findMany({
      include: {
        permissions: {
          include: {
            adminPermission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to match AdminRoleWithPermissions interface
    const formattedRoles = roles.map((role) => ({
      id: role.id,
      title: role.title,
      description: role.description,
      permissions: role.permissions.map((p) => ({
        adminPermissionId: p.adminPermissionId,
        adminPermission: {
          id: p.adminPermission.id,
          object: p.adminPermission.object,
          action: p.adminPermission.action,
        },
      })),
    }));

    return {
      message: 'Get all roles successfully',
      data: formattedRoles,
    };
  }

  /**
   * Get a single role by ID with its permissions
   */
  async getRoleById(roleId: string): Promise<successResponse> {
    const role = await this.prisma.adminRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            adminPermission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Transform to match AdminRoleWithPermissions interface
    const formattedRole = {
      id: role.id,
      title: role.title,
      description: role.description,
      permissions: role.permissions.map((p) => ({
        adminPermissionId: p.adminPermissionId,
        adminPermission: {
          id: p.adminPermission.id,
          object: p.adminPermission.object,
          action: p.adminPermission.action,
        },
      })),
    };

    return {
      message: 'Get role successfully',
      data: formattedRole,
    };
  }

  /**
   * Create a new role with permissions
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<successResponse> {
    const { title, description, permissionIds } = createRoleDto;

    // Verify all permissions exist
    const permissions = await this.prisma.adminPermission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Create role with permissions
    const role = await this.prisma.adminRole.create({
      data: {
        title,
        description,
        permissions: {
          create: permissionIds.map((permissionId) => ({
            adminPermissionId: permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            adminPermission: true,
          },
        },
      },
    });

    // Transform to match AdminRoleWithPermissions interface
    const formattedRole = {
      id: role.id,
      title: role.title,
      description: role.description,
      permissions: role.permissions.map((p) => ({
        adminPermissionId: p.adminPermissionId,
        adminPermission: {
          id: p.adminPermission.id,
          object: p.adminPermission.object,
          action: p.adminPermission.action,
        },
      })),
    };

    return {
      message: 'Role created successfully',
      data: formattedRole,
    };
  }

  /**
   * Update a role and its permissions
   */
  async updateRole(
    roleId: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<successResponse> {
    const { title, description, permissionIds } = updateRoleDto;

    // Check if role exists
    const existingRole = await this.prisma.adminRole.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // If permissionIds provided, verify all permissions exist
    if (permissionIds) {
      const permissions = await this.prisma.adminPermission.findMany({
        where: {
          id: {
            in: permissionIds,
          },
        },
      });

      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('One or more permission IDs are invalid');
      }
    }

    // Update role
    const role = await this.prisma.adminRole.update({
      where: { id: roleId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(permissionIds && {
          permissions: {
            deleteMany: {},
            create: permissionIds.map((permissionId) => ({
              adminPermissionId: permissionId,
            })),
          },
        }),
      },
      include: {
        permissions: {
          include: {
            adminPermission: true,
          },
        },
      },
    });

    // Transform to match AdminRoleWithPermissions interface
    const formattedRole = {
      id: role.id,
      title: role.title,
      description: role.description,
      permissions: role.permissions.map((p) => ({
        adminPermissionId: p.adminPermissionId,
        adminPermission: {
          id: p.adminPermission.id,
          object: p.adminPermission.object,
          action: p.adminPermission.action,
        },
      })),
    };

    return {
      message: 'Role updated successfully',
      data: formattedRole,
    };
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<successResponse> {
    // Check if role exists
    const existingRole = await this.prisma.adminRole.findUnique({
      where: { id: roleId },
      include: {
        admins: true,
      },
    });

    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if any admins are using this role
    if (existingRole.admins.length > 0) {
      throw new BadRequestException(
        `Cannot delete role. ${existingRole.admins.length} admin(s) are using this role`,
      );
    }

    // Delete role (permissions will be deleted automatically due to cascade)
    await this.prisma.adminRole.delete({
      where: { id: roleId },
    });

    return {
      message: 'Role deleted successfully',
    };
  }

  /**
   * Get all admin accounts with their roles
   */
  async getAllAdmins(): Promise<successResponse> {
    const admins = await this.prisma.admin.findMany({
      include: {
        adminRole: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove password hash from response
    const formattedAdmins = admins.map((admin) => {
      const { passwordHash, ...adminData } = admin;
      return adminData;
    });

    return {
      message: 'Get all admins successfully',
      data: formattedAdmins,
    };
  }

  /**
   * Create a new admin account
   */
  async createAdmin(createAdminDto: CreateAdminDto): Promise<successResponse> {
    const { fullName, email, password, roleId } = createAdminDto;

    // Check if email already exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new ConflictException('Email already exists');
    }

    // Check if role exists
    const role = await this.prisma.adminRole.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await this.prisma.admin.create({
      data: {
        fullName,
        email,
        passwordHash,
        adminRoleId: roleId,
      },
      include: {
        adminRole: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...adminData } = admin;

    return {
      message: 'Admin created successfully',
      data: adminData,
    };
  }

  /**
   * Update an admin account
   */
  async updateAdmin(
    adminId: string,
    updateAdminDto: UpdateAdminDto,
  ): Promise<successResponse> {
    const { fullName, email, password, roleId } = updateAdminDto;

    // Check if admin exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!existingAdmin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    // Check if email already exists (if updating email)
    if (email && email !== existingAdmin.email) {
      const emailExists = await this.prisma.admin.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check if role exists (if updating role)
    if (roleId) {
      const role = await this.prisma.adminRole.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${roleId} not found`);
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Update admin
    const admin = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(passwordHash !== undefined && { passwordHash }),
        ...(roleId !== undefined && { adminRoleId: roleId }),
      },
      include: {
        adminRole: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Remove password hash from response
    const { passwordHash: _, ...adminData } = admin;

    return {
      message: 'Admin updated successfully',
      data: adminData,
    };
  }

  /**
   * Delete an admin account
   */
  async deleteAdmin(adminId: string): Promise<successResponse> {
    // Check if admin exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!existingAdmin) {
      throw new NotFoundException(`Admin with ID ${adminId} not found`);
    }

    // Delete admin
    await this.prisma.admin.delete({
      where: { id: adminId },
    });

    return {
      message: 'Admin deleted successfully',
    };
  }
}
