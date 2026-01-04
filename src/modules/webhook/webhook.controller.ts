import { Controller, Get } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  @Get('question-spr')
  async handleQuestionSpr() {
    return {
      message: 'Hello World',
    };
  }
}
