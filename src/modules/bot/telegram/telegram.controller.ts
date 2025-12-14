import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiExcludeController()
@Public()
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async handleUpdate(@Body() update: any) {
    this.telegramService.handleUpdate(update.message);
    return 'ok';
  }

  @Get('webhook')
  async handleWebhook() {
    return 'Webhook received';
  }
}
