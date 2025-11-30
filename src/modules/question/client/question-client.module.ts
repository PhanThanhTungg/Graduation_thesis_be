import { Module } from '@nestjs/common';
import { QuestionController } from './question-client.controller';
import { QuestionService } from './question-client.service';
import { GeminiModule } from 'src/shared/AI/gemini/gemini.module';

@Module({
  controllers: [QuestionController],
  providers: [QuestionService],
  imports: [GeminiModule],
})
export class QuestionClientModule {}
