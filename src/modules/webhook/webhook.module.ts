import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { QuestionModule } from '../question/client/question-client.module';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService],
  imports: [QuestionModule],
})
export class WebhookModule {}
