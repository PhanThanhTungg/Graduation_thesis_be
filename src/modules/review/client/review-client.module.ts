import { Module } from '@nestjs/common';
import { ReviewController } from './review-client.controller';
import { ReviewService } from './review-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewClientModule {}
