import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { AdminCheckGuard } from 'src/common/guards/admin-check.guard';
import { AdminOnly } from 'src/common/decorators/admin-only.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { fullObjectFilter, paginationFilter } from 'src/common/interfaces/objectFilter.interface';

@Controller('category')
@ApiTags('Category')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, AdminCheckGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // route for admin
  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Admin - Create a new category' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Admin - Update a category' })
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Admin - Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteSoftById(id);
  }

  // route for all

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get a category by slug' })
  async getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.getCategoryBySlug(slug);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', type: String, required: false })
  async getAllCategories(@Query() filter: fullObjectFilter) {
    return this.categoryService.getAllCategories(filter);
  }
}
