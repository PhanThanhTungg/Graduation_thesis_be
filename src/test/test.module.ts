import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { LoggingService } from '../shared/logging/logging.service';

@Module({
  controllers: [TestController],
  providers: [LoggingService]
})
export class TestModule {}
