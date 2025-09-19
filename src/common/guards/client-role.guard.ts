import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from 'src/common/enums/common.enum'

export const ClientRoles = (...roles: UserRole[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('client-roles', roles, target, propertyKey)
  }
}

@Injectable()
export class ClientRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'client-roles',
      context.getHandler(),
    )

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found')
    }

    const hasRole = requiredRoles.includes(user.role)

    if (!hasRole) {
      throw new ForbiddenException('Insufficient role permissions')
    }

    return true
  }
}
