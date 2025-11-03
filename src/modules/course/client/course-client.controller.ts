import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CourseService } from './course-client.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateCourseDto } from './dto/course.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';

@Controller('course')
@ApiTags('Client / Course')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  @Public()  
  @ApiOperation({ summary: 'Get all courses (pagination, sort, search)' })
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getAllCourses(@Query() filter: fullObjectFilter) {
    return this.courseService.getAllCourses(filter);
  }

  @Post()
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.createCourse(createCourseDto, user);
  }
}
