import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { LoggingService } from '../shared/logging/logging.service';

@Module({
  controllers: [TestController],
  providers: [TestService, LoggingService]
})
export class TestModule {}
