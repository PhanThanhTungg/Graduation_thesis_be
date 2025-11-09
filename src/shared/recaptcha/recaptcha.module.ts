import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecaptchaService } from './recaptcha.service';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [ConfigModule, LoggingModule],
  providers: [RecaptchaService],
  exports: [RecaptchaService],
})
export class RecaptchaModule {}
