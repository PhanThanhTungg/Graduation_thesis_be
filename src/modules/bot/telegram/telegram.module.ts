import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { ClientAuthModule } from 'src/modules/auth/client/client-auth.module';
import { QuestionModule } from 'src/modules/question/client/question-client.module';
import { ClientSettingModule } from 'src/modules/setting/client/client-setting.module';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService],
  imports: [ClientAuthModule, QuestionModule, ClientSettingModule],
  exports: [TelegramService],
})
export class TelegramModule {}
