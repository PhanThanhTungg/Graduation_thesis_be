import { Module } from '@nestjs/common';
import { LessonController } from './lesson-client.controller';
import { LessonService } from './lesson-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  controllers: [LessonController],
  providers: [LessonService],
  imports: [PrismaModule],
  exports: [LessonService],
})
export class LessonClientModule {}

