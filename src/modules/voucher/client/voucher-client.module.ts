import { Module } from '@nestjs/common';
import { VoucherClientController } from './voucher-client.controller';
import { VoucherClientService } from './voucher-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [VoucherClientController],
  providers: [VoucherClientService],
  exports: [VoucherClientService],
})
export class VoucherClientModule {}
