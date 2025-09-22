import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { LoggingService } from '../shared/logging/logging.service';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';

@Module({
  controllers: [TestController],
  providers: [LoggingService, ClientRoleGuard],
})
export class TestModule {}
