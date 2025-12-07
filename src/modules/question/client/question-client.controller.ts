import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { GenerateQuestionsDto } from './dto/generate.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@Controller('question')
@ApiTags('Client / Question')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}
  // I) ROUTES FOR STUDENT

  @Post('/generate-questions/:lessonSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Generate questions for a lesson' })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  async generateQuestions(
    @Body() dto: GenerateQuestionsDto,
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.questionService.generateQuestions(lessonSlug, dto, user.id);
  }

  @Post('/answer-question/:questionId')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Answer a question' })
  @ApiParam({ name: 'questionId', type: String, required: true })
  async answerQuestion(
    @Body() dto: AnswerQuestionDto,
    @Param('questionId') questionId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.questionService.answerQuestion(questionId, dto, user.id);
  }

  @Get('/history/:lessonSlug')
  @ApiBearerAuth()
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Get question history for a lesson' })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  async getQuestionHistory(
    @Param('lessonSlug') lessonSlug: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.questionService.getQuestionHistory(lessonSlug, user.id);
  }
}
