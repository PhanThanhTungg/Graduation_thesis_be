import { Controller, Get, Query, UseGuards, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiParam } from '@nestjs/swagger';
import { ADMIN_API_PREFIX } from 'src/common/constants/api.constant';
import { AuthGuard } from '@nestjs/passport';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';
import { AdminCourseService } from './admin-course.service';

@Controller(`${ADMIN_API_PREFIX}/course`)
@ApiTags('Admin - Course')
@ApiBearerAuth()
@UseGuards(AuthGuard('admin-jwt'))
export class AdminCourseController {
  constructor(private readonly adminCourseService: AdminCourseService) {}

  @Get()
  @ApiOperation({ summary: 'Admin - Get all courses with pagination, sort, and search' })
  @ApiQuery({ name: 'keySearch', type: String, required: false, description: 'Search by course title' })
  @ApiQuery({ name: 'sortField', type: String, required: false, description: 'Field to sort by (e.g., title, price, createdAt)' })
  @ApiQuery({ name: 'sortOrder', type: String, required: false, description: 'Sort order (asc or desc)' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page' })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false, description: 'Include deleted courses' })
  async getAllCourses(@Query() filter: fullObjectFilter) {
    return this.adminCourseService.getAllCourses(filter);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin - Soft delete a course by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  async deleteCourse(@Param('id') id: string) {
    return this.adminCourseService.deleteCourse(id);
  }
}
