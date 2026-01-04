import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_PERMISSIONS_KEY,
  RequiredPermission,
} from '../decorators/require-permissions.decorator';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role?: string;
  permissions: Array<{
    adminPermissionId: string;
    adminPermission: {
      object: string;
      action: string;
    };
  }>;
}

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequiredPermission[]
    >(REQUIRE_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AdminUser = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.permissions || user.permissions.length === 0) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    const hasPermission = requiredPermissions.every((required) =>
      user.permissions.some(
        (userPerm) =>
          userPerm.adminPermission.object === required.object &&
          userPerm.adminPermission.action === required.action,
      ),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have the required permissions to access this resource',
      );
    }

    return true;
  }
}
