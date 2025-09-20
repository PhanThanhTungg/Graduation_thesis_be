import { Module, Global } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingInterceptor } from './logging.interceptor';

@Global()
@Module({
  providers: [LoggingService, LoggingInterceptor],
  exports: [LoggingService, LoggingInterceptor],
})
export class LoggingModule {}
