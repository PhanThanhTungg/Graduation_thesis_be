import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { LoggingService } from '../shared/logging/logging.service';
import { ClientRoleGuard } from 'src/common/guards/client-role.guard';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';

@Module({
  controllers: [TestController],
  providers: [LoggingService, ClientRoleGuard, UniversalAuthGuard],
})
export class TestModule {}
