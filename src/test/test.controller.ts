import { Controller, Get, Post, Body, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { TestService } from './test.service';
import { LoggingService } from '../shared/logging/logging.service';

@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly loggingService: LoggingService,
  ) {}

  @Get('slow')
  async getSlow() {
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.loggingService.error('Slow request completed');
    return { message: 'Slow request completed' };
  }
}