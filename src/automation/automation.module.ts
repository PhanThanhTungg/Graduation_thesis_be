import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SpaceRepetitionJob } from './schedule/space-repetition.schedule';
import { SpaceRepetitionWorker } from './workers/space-repetition.worker';
import { WithdrawalWorker } from './workers/withdrawal.worker';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { RabbitMQModule } from 'src/shared/rabbitmq/rabbitmq.module';
import { TelegramModule } from 'src/modules/bot/telegram/telegram.module';
import { QuestionModule } from 'src/modules/question/client/question-client.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { InsertRolePermissionJob } from 'src/jobs/insert-role-permission.job';
import { UpdateSuperAdminPermissionJob } from 'src/jobs/update-super-admin-permission.job';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    RabbitMQModule,
    TelegramModule,
    QuestionModule,
    PaymentModule,
  ],
  providers: [
    SpaceRepetitionJob,
    SpaceRepetitionWorker,
    WithdrawalWorker,
    InsertRolePermissionJob,
    UpdateSuperAdminPermissionJob,
  ],
  exports: [InsertRolePermissionJob, UpdateSuperAdminPermissionJob],
})
export class AutomationModule {}
