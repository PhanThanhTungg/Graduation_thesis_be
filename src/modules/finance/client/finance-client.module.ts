import { Module } from '@nestjs/common';
import { FinanceClientController } from './finance-client.controller';
import { FinanceClientService } from './finance-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { RabbitMQModule } from 'src/shared/rabbitmq/rabbitmq.module';
import { PaymentModule } from 'src/modules/payment/payment.module';
import { EnvModule } from 'src/shared/env/env.module';

@Module({
  imports: [PrismaModule, RabbitMQModule, PaymentModule, EnvModule],
  controllers: [FinanceClientController],
  providers: [FinanceClientService],
})
export class FinanceClientModule {}
