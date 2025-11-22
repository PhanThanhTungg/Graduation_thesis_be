import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthModule } from '../../../shared/jwt/jwt.module';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { EmailModule } from '../../../shared/email/email.module';
import { RecaptchaModule } from '../../../shared/recaptcha/recaptcha.module';
import { EnvModule } from '../../../shared/env/env.module';
import { ClientAuthController } from './client-auth.controller';
import { ClientAuthService } from './client-auth.service';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { ClientJwtStrategy } from 'src/common/strategies/client-jwt.strategy';
import { GoogleStrategy } from 'src/common/strategies/google.strategy';
import { FacebookStrategy } from 'src/common/strategies/facebook.strategy';
import { FacebookAuthGuard } from 'src/common/guards/facebook-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtAuthModule,
    PrismaModule,
    EmailModule,
    RecaptchaModule,
    EnvModule,
  ],
  controllers: [ClientAuthController],
  providers: [
    ClientAuthService,
    ClientJwtStrategy,
    ClientRoleGuard,
    GoogleStrategy,
    FacebookStrategy,
    FacebookAuthGuard,
  ],
  exports: [ClientAuthService, ClientRoleGuard],
})
export class ClientAuthModule {}
