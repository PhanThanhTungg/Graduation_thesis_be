import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export const AdminPermissions = (...permissions: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('admin-permissions', permissions, target, propertyKey)
  }
}

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'admin-permissions',
      context.getHandler(),
    )

    if (!requiredPermissions) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.permissions) {
      throw new ForbiddenException('User permissions not found')
    }

    const hasPermission = requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    )

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}
