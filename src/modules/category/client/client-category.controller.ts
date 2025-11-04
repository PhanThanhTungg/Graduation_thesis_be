import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { AdminCheckGuard } from 'src/common/guards/admin-check.guard';
import { Public } from 'src/common/decorators/public.decorator';
import { categoryFilter, fullObjectFilter, objectSearchFilter } from 'src/common/interfaces/objectFilter.interface';
import { ClientCategoryService } from './client-category.service';

@Controller('category')
@ApiTags('Client - Category')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, AdminCheckGuard)
export class ClientCategoryController {
  constructor(private readonly clientCategoryService: ClientCategoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  async getAllCategories(@Query() filter: objectSearchFilter  ) {
    return this.clientCategoryService.getAllCategories(filter);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get a category by slug' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.clientCategoryService.getCategoryBySlug(slug);
  }
}
