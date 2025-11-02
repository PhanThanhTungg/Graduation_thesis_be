import { Module } from '@nestjs/common';
import { EnvModule } from './shared/env/env.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { EmailModule } from './shared/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TestModule } from './test/test.module';
import { LoggingModule } from './shared/logging/logging.module';
import { CourseModule } from './modules/course/client/course-client.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    EmailModule,
    LoggingModule,
    AuthModule,
    ProfileModule,
    TestModule,
    CourseModule,
    CategoryModule,
  ],
  providers: [
  ],
})
export class AppModule {}
