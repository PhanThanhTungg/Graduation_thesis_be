import { Module } from '@nestjs/common';
import { EnvModule } from './shared/env/env.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    AuthModule,
    TestModule,
  ],
  providers: [],
})
export class AppModule {}
