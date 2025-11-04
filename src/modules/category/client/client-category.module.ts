import { Module } from '@nestjs/common';
import { ClientCategoryController } from './client-category.controller';
import { ClientCategoryService } from './client-category.service';
import { CategoryModule } from '../category.module';

@Module({
  controllers: [ClientCategoryController],
  providers: [ClientCategoryService],
  imports: [CategoryModule]
})
export class ClientCategoryModule {}
