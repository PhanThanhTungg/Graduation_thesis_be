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
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
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
  @ApiOperation({ 
    summary: 'Get all courses with advanced filters',
    description: `
      Get all published courses with filtering, pagination, sorting, and search:
      - Filter by multiple categories (comma-separated IDs)
      - Filter by multiple ratings (comma-separated values 1-5)
      - Filter by price range (from-to)
      - Search by course name or description
      - Pagination and sorting support
      
      Examples:
      - /course?categoryIds=uuid1,uuid2
      - /course?ratings=4,5
      - /course?priceFrom=0&priceTo=100
      - /course?categoryIds=uuid1&ratings=4,5&priceFrom=50&priceTo=200
      - /course?search=web development&sortBy=rating&sortOrder=DESC
    `
  })
  @ApiQuery({ name: 'categoryIds', required: false, description: 'Filter by category IDs (comma-separated)', example: 'uuid1,uuid2' })
  @ApiQuery({ name: 'ratings', required: false, description: 'Filter by ratings (comma-separated)', example: '4,5' })
  @ApiQuery({ name: 'priceFrom', required: false, description: 'Minimum price', example: 0, type: Number })
  @ApiQuery({ name: 'priceTo', required: false, description: 'Maximum price', example: 1000, type: Number })
  @ApiQuery({ name: 'search', required: false, description: 'Search by course name or description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1, type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 10, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'price', 'rating', 'title'], example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], example: 'DESC' })
  async getAllCourses(@Query() dto: GetCoursesDto) {
    return this.courseService.getAllCoursesWithFilters(dto);
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

  @Get('/teacher-area/slug/:slug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get course by slug (teacher area)' })
  @ApiParam({ name: 'slug', type: String, required: true })
  async getCourseBySlugTeacherArea(
    @Param('slug') slug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.getCourseBySlugTeacherArea(slug, user.id);
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

  @Get('/teacher-area/slug/:slug/chapters')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get chapter tree by course slug (teacher area)' })
  @ApiParam({ name: 'slug', type: String, required: true })
  async getChapterTreeBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.getChapterTreeBySlug(slug, user.id);
  }

  @Post('/teacher-area/slug/:slug/chapters')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Create chapter under course slug (teacher area)' })
  @ApiParam({ name: 'slug', type: String, required: true })
  async createChapterBySlug(
    @Param('slug') slug: string,
    @Body() createChapterDto: CreateChapterDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.createChapterBySlug(slug, createChapterDto, user.id);
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

  @Patch('/teacher-area/:id/chapters/:chapterId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Update chapter by course id and chapter id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiParam({ name: 'chapterId', type: String, required: true })
  async updateChapter(
    @Param('id') id: string,
    @Param('chapterId') chapterId: string,
    @Body() updateChapterDto: UpdateChapterDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.updateChapter(id, chapterId, updateChapterDto, user.id);
  }

  @Delete('/teacher-area/slug/:slug/chapters/:chapterId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Delete chapter by slug and chapter id (teacher area)' })
  @ApiParam({ name: 'slug', type: String, required: true })
  @ApiParam({ name: 'chapterId', type: String, required: true })
  async deleteChapterBySlug(
    @Param('slug') slug: string,
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.deleteChapterBySlug(slug, chapterId, user.id);
  }

  @Delete('/teacher-area/:id/chapters/:chapterId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Delete chapter by course id and chapter id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiParam({ name: 'chapterId', type: String, required: true })
  async deleteChapter(
    @Param('id') id: string,
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.courseService.deleteChapter(id, chapterId, user.id);
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
