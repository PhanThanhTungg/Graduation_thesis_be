import { Module } from '@nestjs/common';
import { PaypalService } from './paypal.service';
import { EnvModule } from 'src/shared/env/env.module';

@Module({
  imports: [EnvModule],
  providers: [PaypalService],
  exports: [PaypalService],
})
export class PaymentModule {}
