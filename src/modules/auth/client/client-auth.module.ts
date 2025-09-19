import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtAuthModule } from '../../../shared/jwt/jwt.module'
import { PrismaModule } from '../../../shared/prisma/prisma.module'
import { ClientAuthController } from './client-auth.controller'
import { ClientAuthService } from './client-auth.service'
import { ClientRoleGuard } from 'src/common/guards/client-role.guard' 
import { ClientJwtStrategy } from 'src/common/strategies/client-jwt.strategy'

@Module({
  imports: [PassportModule, JwtAuthModule, PrismaModule],
  controllers: [ClientAuthController],
  providers: [ClientAuthService, ClientJwtStrategy, ClientRoleGuard],
  exports: [ClientAuthService, ClientRoleGuard],
})
export class ClientAuthModule {}
