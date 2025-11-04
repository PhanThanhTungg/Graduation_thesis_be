import { Module } from '@nestjs/common';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryService } from './admin-category.service';
import { CategoryModule } from '../category.module';

@Module({
  controllers: [AdminCategoryController],
  providers: [AdminCategoryService],
  imports: [CategoryModule]
})
export class AdminCategoryModule {}
