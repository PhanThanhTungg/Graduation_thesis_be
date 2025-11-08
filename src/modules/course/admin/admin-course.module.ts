import { Module } from '@nestjs/common';
import { AdminCourseController } from './admin-course.controller';
import { AdminCourseService } from './admin-course.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminCourseController],
  providers: [AdminCourseService],
  exports: [AdminCourseService],
})
export class AdminCourseModule {}
