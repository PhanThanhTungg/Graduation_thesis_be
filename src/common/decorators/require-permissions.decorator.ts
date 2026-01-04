import { SetMetadata } from '@nestjs/common';
import { AdminObject, AdminAction } from '@prisma/client';

export const REQUIRE_PERMISSIONS_KEY = 'require-permissions';

export interface RequiredPermission {
  object: AdminObject;
  action: AdminAction;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
