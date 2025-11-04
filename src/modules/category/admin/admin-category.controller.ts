import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AdminCategoryService } from './admin-category.service';
import { ADMIN_API_PREFIX } from 'src/common/constants/api.constant';
import { AuthGuard } from '@nestjs/passport';
import { categoryFilter } from 'src/common/interfaces/objectFilter.interface';

@Controller(`${ADMIN_API_PREFIX}/category`)
@ApiTags('Admin - Category')
@ApiBearerAuth()
@UseGuards(AuthGuard('admin-jwt'))
export class AdminCategoryController {
  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Admin - Get all categories' })
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', type: String, required: false })
  async getAllCategories(@Query() filter: categoryFilter) {
    return this.adminCategoryService.getCategories(filter);
  }

  @Post()
  @ApiOperation({ summary: 'Admin - Create a new category' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.adminCategoryService.createCategory(createCategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin - Update a category' })
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.adminCategoryService.updateCategory(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin - Delete a category' })
  async deleteCategory(@Param('id') id: string) {
    return this.adminCategoryService.deleteSoftById(id);
  }
}
