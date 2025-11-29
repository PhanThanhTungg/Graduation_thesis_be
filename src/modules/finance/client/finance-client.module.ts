import { Module } from '@nestjs/common';
import { FinanceClientController } from './finance-client.controller';
import { FinanceClientService } from './finance-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceClientController],
  providers: [FinanceClientService],
})
export class FinanceClientModule {}
