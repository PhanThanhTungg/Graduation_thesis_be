import { Module } from '@nestjs/common';
import { EnvModule } from './shared/env/env.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TestModule } from './test/test.module';
import { LoggingModule } from './shared/logging/logging.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    LoggingModule,
    AuthModule,
    ProfileModule,
    TestModule,
  ],
  providers: [
  ],
})
export class AppModule {}
