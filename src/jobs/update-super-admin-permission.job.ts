import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class UpdateSuperAdminPermissionJob {
  private readonly logger = new Logger(UpdateSuperAdminPermissionJob.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(adminRoleId: string) {
    try {
      this.logger.log(
        `Starting update super admin permissions job for role: ${adminRoleId}`,
      );

      const role = await this.prisma.adminRole.findUnique({
        where: { id: adminRoleId },
      });

      if (!role) {
        throw new Error(`Admin role with id ${adminRoleId} not found`);
      }

      this.logger.log(`Found role: ${role.title || adminRoleId}`);

      const allPermissions = await this.prisma.adminPermission.findMany();

      if (allPermissions.length === 0) {
        this.logger.warn('No permissions found in database');
        return;
      }

      this.logger.log(`Found ${allPermissions.length} permissions in database`);

      const existingRolePermissions =
        await this.prisma.adminRolePermission.findMany({
          where: { adminRoleId },
          select: { adminPermissionId: true },
        });

      const existingPermissionIds = new Set(
        existingRolePermissions.map((rp) => rp.adminPermissionId),
      );

      const permissionsToAdd = allPermissions.filter(
        (p) => !existingPermissionIds.has(p.id),
      );

      if (permissionsToAdd.length === 0) {
        this.logger.log(
          `Role already has all ${allPermissions.length} permissions`,
        );
        return;
      }

      this.logger.log(
        `Adding ${permissionsToAdd.length} permissions to role...`,
      );

      await this.prisma.adminRolePermission.createMany({
        data: permissionsToAdd.map((permission) => ({
          adminRoleId,
          adminPermissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      this.logger.log(
        `Successfully added ${permissionsToAdd.length} permissions to role ${adminRoleId}`,
      );
      this.logger.log(
        `Role now has ${allPermissions.length} permissions in total`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating super admin permissions for role ${adminRoleId}:`,
        error,
      );
      throw error;
    }
  }
}
