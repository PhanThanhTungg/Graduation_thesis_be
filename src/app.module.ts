import { Module } from '@nestjs/common';
import { EnvModule } from './shared/env/env.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { EmailModule } from './shared/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TestModule } from './test/test.module';
import { LoggingModule } from './shared/logging/logging.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    EmailModule,
    LoggingModule,
    AuthModule,
    ProfileModule,
    TestModule,
  ],
  providers: [
  ],
})
export class AppModule {}
