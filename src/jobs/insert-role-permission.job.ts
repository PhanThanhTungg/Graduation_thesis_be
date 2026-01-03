import { Injectable, Logger } from '@nestjs/common';
import { AdminAction, AdminObject } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class InsertRolePermissionJob {
  private readonly logger = new Logger(InsertRolePermissionJob.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    try {
      this.logger.log('Starting insert admin permissions job...');

      const permissions: Array<{
        object: AdminObject;
        action: AdminAction;
      }> = [
        { object: AdminObject.dashboard, action: AdminAction.view },
        { object: AdminObject.course, action: AdminAction.view },
        { object: AdminObject.course, action: AdminAction.edit },
        { object: AdminObject.course, action: AdminAction.delete },
        { object: AdminObject.course, action: AdminAction.create },
        { object: AdminObject.category, action: AdminAction.view },
        { object: AdminObject.category, action: AdminAction.edit },
        { object: AdminObject.category, action: AdminAction.delete },
        { object: AdminObject.category, action: AdminAction.create },
        { object: AdminObject.transaction, action: AdminAction.view },
        { object: AdminObject.payment, action: AdminAction.view },
        { object: AdminObject.payment, action: AdminAction.edit },
        { object: AdminObject.user, action: AdminAction.view },
        { object: AdminObject.user, action: AdminAction.edit },
        { object: AdminObject.user, action: AdminAction.delete },
        { object: AdminObject.permission, action: AdminAction.view },
        { object: AdminObject.permission, action: AdminAction.edit },
        { object: AdminObject.permission, action: AdminAction.delete },
        { object: AdminObject.permission, action: AdminAction.create },
        { object: AdminObject.admin, action: AdminAction.view },
        { object: AdminObject.admin, action: AdminAction.edit },
        { object: AdminObject.admin, action: AdminAction.delete },
        { object: AdminObject.admin, action: AdminAction.create },
        { object: AdminObject.setting, action: AdminAction.view },
        { object: AdminObject.setting, action: AdminAction.edit },
      ];

      for (const permission of permissions) {
        const existing = await this.prisma.adminPermission.findFirst({
          where: {
            object: permission.object,
            action: permission.action,
          },
        });

        if (!existing) {
          await this.prisma.adminPermission.create({
            data: {
              object: permission.object,
              action: permission.action,
            },
          });

          this.logger.log(
            `Inserted permission: ${permission.object} - ${permission.action}`,
          );
        } else {
          this.logger.log(
            `Permission already exists: ${permission.object} - ${permission.action}`,
          );
        }
      }

      this.logger.log(
        `Successfully inserted ${permissions.length} admin permissions`,
      );
    } catch (error) {
      this.logger.error('Error inserting admin permissions:', error);
      throw error;
    }
  }
}
