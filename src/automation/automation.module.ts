import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SpaceRepetitionJob } from './jobs/space-repetition.job';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { TelegramModule } from 'src/modules/bot/telegram/telegram.module';
import { QuestionModule } from 'src/modules/question/client/question-client.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    TelegramModule,
    QuestionModule,
  ],
  providers: [SpaceRepetitionJob],
})
export class AutomationModule {}
