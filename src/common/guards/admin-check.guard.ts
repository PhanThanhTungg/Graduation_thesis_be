import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY } from '../decorators/admin-only.decorator';

@Injectable()
export class AdminCheckGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isAdminOnly) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || (user.role !== 'admin' && !user.permissions)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
