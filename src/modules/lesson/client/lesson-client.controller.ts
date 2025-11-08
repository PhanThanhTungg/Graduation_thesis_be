import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LessonService } from './lesson-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateLessonDto } from './dto/lesson.dto';

@Controller('lesson')
@ApiTags('Client / Lesson')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

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
  @ApiOperation({ summary: 'Get lessons by chapter id (teacher area)' })
  @ApiParam({ name: 'chapterId', type: String, required: true })
  async getLessonsByChapterId(
    @Param('chapterId') chapterId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.lessonService.getLessonsByChapterId(chapterId, user.id);
  }
}

