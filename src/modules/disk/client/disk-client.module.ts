import { Module } from '@nestjs/common';
import { DiskClientController } from './disk-client.controller';
import { DiskClientService } from './disk-client.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiskClientController],
  providers: [DiskClientService],
})
export class DiskClientModule {}
