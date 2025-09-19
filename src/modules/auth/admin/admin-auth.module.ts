import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtAuthModule } from '../../../shared/jwt/jwt.module'
import { PrismaModule } from '../../../shared/prisma/prisma.module'
import { AdminAuthController } from './admin-auth.controller'
import { AdminAuthService } from './admin-auth.service'
import { AdminJwtStrategy } from '../../../common/strategies/admin-jwt.strategy'
import { AdminPermissionGuard } from '../../../common/guards/admin-permission.guard'

@Module({
  imports: [PassportModule, JwtAuthModule, PrismaModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtStrategy, AdminPermissionGuard],
  exports: [AdminAuthService, AdminPermissionGuard],
})
export class AdminAuthModule {}
