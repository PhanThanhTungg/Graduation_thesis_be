import { Module } from '@nestjs/common';
import { FinanceClientController } from './finance-client.controller';
import { FinanceClientService } from './finance-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { RabbitMQModule } from 'src/shared/rabbitmq/rabbitmq.module';

@Module({
  imports: [PrismaModule, RabbitMQModule],
  controllers: [FinanceClientController],
  providers: [FinanceClientService],
})
export class FinanceClientModule {}
