import { Module } from '@nestjs/common';
import { CourseController } from './course-client.controller';
import { CourseService } from './course-client.service';
import { CategoryModule } from 'src/modules/category/category.module';

@Module({
  controllers: [CourseController],
  providers: [CourseService],
  imports: [CategoryModule]
})
export class CourseModule {}
