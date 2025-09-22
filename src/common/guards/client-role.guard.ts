import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from 'src/common/enums/common.enum'

export const CLIENT_ROLES_KEY = 'client-roles'
export const ClientRoles = (...roles: UserRole[]) => SetMetadata(CLIENT_ROLES_KEY, roles)

@Injectable()
export class ClientRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(CLIENT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

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
