import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'

@Injectable()
export class UniversalAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    
    if (request.user) {
      return true
    }

    try {
      const adminGuard = new (AuthGuard('admin-jwt'))()
      const adminResult = await adminGuard.canActivate(context)
      if (adminResult) {
        return true
      }
    } catch (error) {
    }

    try {
      const clientGuard = new (AuthGuard('client-jwt'))()
      const clientResult = await clientGuard.canActivate(context)
      if (clientResult) {
        return true
      }
    } catch (error) {
    }

    throw new UnauthorizedException('Authentication required')
  }
}

export const UseUniversalAuth = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey) {
      Reflect.defineMetadata('universal-auth', true, target, propertyKey)
    }
  }
}

export const UniversalAuth = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      const originalMethod = descriptor.value
      
      descriptor.value = async function (...args: any[]) {
        const context = args[0] 
        const request = context.switchToHttp().getRequest()
        
        if (request.user) {
          return originalMethod.apply(this, args)
        }

        try {
          const adminGuard = new (AuthGuard('admin-jwt'))()
          const adminResult = await adminGuard.canActivate(context)
          if (adminResult) {
            return originalMethod.apply(this, args)
          }
        } catch (error) {
        }

        try {
          const clientGuard = new (AuthGuard('client-jwt'))()
          const clientResult = await clientGuard.canActivate(context)
          if (clientResult) {
            return originalMethod.apply(this, args)
          }
        } catch (error) {
        }

        throw new UnauthorizedException('Authentication required')
      }
    }
  }
}
