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
import { AdminCategoryModule } from './modules/category/admin/admin-category.module';
import { ClientCategoryModule } from './modules/category/client/client-category.module';
import { LessonClientModule } from './modules/lesson/client/lesson-client.module';
import { AdminCourseModule } from './modules/course/admin/admin-course.module';
import { AdminUserModule } from './modules/user/admin/admin-user.module';
import { VoucherClientModule } from './modules/voucher/client/voucher-client.module';
import { ReviewClientModule } from './modules/review/client/review-client.module';
import { PaymentClientModule } from './modules/payment/client/payment-client.module';
import { NoteClientModule } from './modules/note/client/note-client.module';
import { StudentModule } from './modules/student/client/student.module';
import { FinanceClientModule } from './modules/finance/client/finance-client.module';

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
    AdminCourseModule,
    CategoryModule,
    AdminCategoryModule,
    ClientCategoryModule,
    LessonClientModule,
    AdminUserModule,
    VoucherClientModule,
    ReviewClientModule,
    PaymentClientModule,
    NoteClientModule,
    StudentModule,
    FinanceClientModule,
  ],
  providers: [],
})
export class AppModule {}
