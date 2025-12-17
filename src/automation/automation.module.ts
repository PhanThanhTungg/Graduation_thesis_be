import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SpaceRepetitionJob } from './jobs/space-repetition.job';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { TelegramModule } from 'src/modules/bot/telegram/telegram.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, TelegramModule],
  providers: [SpaceRepetitionJob],
})
export class AutomationModule {}
