import { Module } from '@nestjs/common';
import { QuestionController } from './question-client.controller';
import { QuestionService } from './question-client.service';
import { GeminiModule } from 'src/shared/AI/gemini/gemini.module';
import { GroqModule } from 'src/shared/AI/groq/groq.module';
import { AdminSettingModule } from 'src/modules/setting/admin/admin-setting.module';

@Module({
  controllers: [QuestionController],
  providers: [QuestionService],
  imports: [GeminiModule, GroqModule, AdminSettingModule],
  exports: [QuestionService],
})
export class QuestionModule {}
