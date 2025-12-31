import { Module } from '@nestjs/common';
import { ReviewSpaceController } from './review-space.controller';
import { ReviewSpaceService } from './review-space.service';
import { LessonClientModule } from '../lesson/client/lesson-client.module';

@Module({
  controllers: [ReviewSpaceController],
  providers: [ReviewSpaceService],
  imports: [LessonClientModule],
})
export class ReviewSpaceModule {}
