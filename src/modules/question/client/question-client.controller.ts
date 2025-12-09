import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiParam,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
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
import { QuestionHistoryQueryDto } from './dto/question-history-query.dto';

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
  @ApiOperation({
    summary: 'Get question history for a lesson with pagination and filters',
  })
  @ApiParam({ name: 'lessonSlug', type: String, required: true })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'type',
    type: String,
    required: false,
    description: 'Filter by question type',
  })
  @ApiQuery({
    name: 'difficulty',
    type: String,
    required: false,
    description: 'Filter by difficulty',
  })
  @ApiQuery({
    name: 'sortBy',
    type: String,
    required: false,
    enum: ['date', 'score'],
    description: 'Sort by field',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  async getQuestionHistory(
    @Param('lessonSlug') lessonSlug: string,
    @Query() query: QuestionHistoryQueryDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.questionService.getQuestionHistory(lessonSlug, user.id, query);
  }
}
