import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { QuestionService } from './question-client.service';
import { ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';

@Controller('question')
@ApiTags('Client / Question')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}
  // I) ROUTES FOR STUDENT

  // 1.1) routes for generating questions
  @Post('/generate-questions/:lessonSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Generate questions for a lesson' })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  async generateQuestions(
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.questionService.generateQuestions(lessonSlug, user.id);
  }
}
