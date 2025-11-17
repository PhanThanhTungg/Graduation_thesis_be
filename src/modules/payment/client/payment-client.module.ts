import { Module } from '@nestjs/common';
import { PaymentClientController } from './payment-client.controller';
import { PaymentClientService } from './payment-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { PaypalService } from '../paypal.service';
import { EnvModule } from 'src/shared/env/env.module';

@Module({
  imports: [PrismaModule, EnvModule],
  controllers: [PaymentClientController],
  providers: [PaymentClientService, PaypalService],
})
export class PaymentClientModule {}

