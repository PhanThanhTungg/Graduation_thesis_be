import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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
  async getAllCourses(@Query() filter: fullObjectFilter) {
    return this.adminCourseService.getAllCourses(filter);
  }
}
