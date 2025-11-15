import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LessonService } from './lesson-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateLessonDto, UpdateLessonDto, UpdateLessonProgressDto } from './dto/lesson.dto';
import { fullObjectFilter } from 'src/common/interfaces/objectFilter.interface';

@Controller('lesson')
@ApiTags('Client / Lesson')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}
  

  // route for student
  @Get('/lesson-chapter-tree/:courseSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Get lesson chapter tree (all)' })
  @ApiParam({ name: 'courseSlug', type: String, required: true })
  async getLessonChapterTree(
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.getLessonChapterTree(courseSlug, user.id);
  }

  @Get('/next-by-course/:courseSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Get next lesson slug by course slug for current student' })
  @ApiParam({ name: 'courseSlug', type: String, required: true })
  async getNextLessonByCourseSlug(
    @Param('courseSlug') courseSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.getNextLessonByCourseSlug(courseSlug, user.id);
  }

  @Get('/:lessonSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Get lesson by slug (student)' })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  async getLessonBySlugForStudent(
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.getLessonBySlugForStudent(lessonSlug, user.id);
  }

  @Post('/ping/status-lesson/:lessonSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Update lesson progress status (student)' })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  async pingStatusLesson(
    @Param('lessonSlug') lessonSlug: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.pingStatusLesson(lessonSlug, dto.progress, user.id);
  }

  // route for teacher
  @Post('/teacher-area/chapter/:chapterId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Create lesson under chapter id (teacher area)' })
  @ApiParam({ name: 'chapterId', type: String, required: true })
  async createLesson(
    @Param('chapterId') chapterId: string,
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.createLesson(chapterId, createLessonDto, user.id);
  }

  @Get('/teacher-area/chapter/:chapterId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get lessons by chapter id (teacher area) with filter, sort, pagination' })
  @ApiParam({ name: 'chapterId', type: String, required: true })
  @ApiQuery({ name: 'keySearch', type: String, required: false })
  @ApiQuery({ name: 'type', type: String, required: false, enum: ['video', 'theory', 'exercise'] })
  @ApiQuery({ name: 'sortField', type: String, required: false })
  @ApiQuery({ name: 'sortOrder', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  async getLessonsByChapterId(
    @Param('chapterId') chapterId: string,
    @Query() filter: fullObjectFilter & { type?: string },
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.getLessonsByChapterId(chapterId, user.id, filter);
  }

  @Get('/teacher-area/:lessonSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get lesson by slug (teacher area)' })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  async getLessonBySlug(
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.getLessonBySlug(lessonSlug, user.id);
  }

  @Patch('/teacher-area/:lessonId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Update lesson by id (teacher area)' })
  @ApiParam({ name: 'lessonId', type: String, required: true })
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.updateLesson(lessonId, updateLessonDto, user.id);
  }

  @Delete('/teacher-area/:lessonId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Delete lesson by id (teacher area)' })
  @ApiParam({ name: 'lessonId', type: String, required: true })
  async deleteLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.deleteLesson(lessonId, user.id);
  }
}

