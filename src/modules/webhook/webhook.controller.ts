import { Body, Controller, Get, Post } from '@nestjs/common';
import { SprQuestionDto } from './dto/spr-quesion.dto';
import { WebhookService } from './webhook.service';
import { AnswerQuestionDto } from './dto/answer-question.dto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('question-spr')
  async handleQuestionSpr(@Body() sprQuestionDto: SprQuestionDto) {
    return this.webhookService.handleQuestionSpr(sprQuestionDto.userId);
  }

  @Post('answer-question')
  async answerQuestion(@Body() answerQuestionDto: AnswerQuestionDto) {
    return this.webhookService.answerQuestion(answerQuestionDto);
  }
}
