import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SpaceRepetitionJob } from './jobs/space-repetition.job';
import { SpaceRepetitionWorker } from './workers/space-repetition.worker';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { RabbitMQModule } from 'src/shared/rabbitmq/rabbitmq.module';
import { TelegramModule } from 'src/modules/bot/telegram/telegram.module';
import { QuestionModule } from 'src/modules/question/client/question-client.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RabbitMQModule,
    TelegramModule,
    QuestionModule,
  ],
  providers: [SpaceRepetitionJob, SpaceRepetitionWorker],
})
export class AutomationModule {}
