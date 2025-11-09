import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CourseService } from './course-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateChapterDto } from './dto/chapter.dto';
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

  // route for all
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

  @Get('/:slug')
  @Public()
  @ApiOperation({ summary: 'Get course by slug' })
  @ApiParam({ name: 'slug', type: String, required: true })
  async getCourseBySlug(@Param('slug') slug: string) {
    return this.courseService.getCourseBySlug(slug);
  }

  @Get('/teacher/:teacherId')
  @Public()
  @ApiOperation({
    summary: 'Get all courses by teacher id (pagination, sort, search)',
  })
  @ApiParam({ name: 'teacherId', type: String, required: true })
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getAllCoursesByTeacherId(
    @Param('teacherId') teacherId: string,
    @Query() filter: fullObjectFilter,
  ) {
    return this.courseService.getCoursesByTeacherId(teacherId, filter);
  }

  // route for signed in user

  // route for teacher
  @Get('/teacher-area/my-courses')
  @ApiBearerAuth()
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'isPublished', type: String, required: false, description: 'Filter by published status: "true" for published, "false" for unpublished' })
  @ClientRoles(UserRole.teacher)
  async getMyCourses(@CurrentUser() user: currentClientUser, @Query() filter: fullObjectFilter) {
    return this.courseService.getMyCourses(user.id, filter);
  }


  @Post('/teacher-area')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.createCourse(createCourseDto, user);
  }

  @Get('/teacher-area/:id')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get course by id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  async getCourseById(
    @Param('id') id: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.getCourseById(id, user.id);
  }

  @Patch('/teacher-area/:id')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Update course by id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.updateCourse(id, updateCourseDto, user.id);
  }

  @Get('/teacher-area/:id/chapters')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get chapter tree by course id (teacher area)' })
  async getChapterTree(
    @Param('id') id: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.getChapterTree(id, user.id);
  }

  @Post('/teacher-area/:id/chapters')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Create chapter under course id (teacher area)' })
  async createChapter(
    @Param('id') id: string,
    @Body() createChapterDto: CreateChapterDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.createChapter(id, createChapterDto, user.id);
  }

  @Delete('/teacher-area/:id')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Delete course by id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.deleteCourse(id, user.id);
  }

}
