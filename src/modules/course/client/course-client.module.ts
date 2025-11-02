import { Module } from '@nestjs/common';
import { CourseController } from './course-client.controller';
import { CourseService } from './course-client.service';

@Module({
  controllers: [CourseController],
  providers: [CourseService]
})
export class CourseModule {}
