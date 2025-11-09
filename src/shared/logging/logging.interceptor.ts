import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from './logging.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const requestId = request.headers['x-request-id'] as string || uuidv4();
    request['requestId'] = requestId;
    response.setHeader('x-request-id', requestId);

    // Extract user ID
    const userId = (request['user'] as any)?.id || request.headers['x-user-id'] as string;

    return next.handle().pipe(
      tap((data) => {
        this.loggingService.logHttpRequest(request, response, startTime, requestId, userId);
      }),
      catchError((error) => {
        this.loggingService.logHttpRequest(request, response, startTime, requestId, userId);
        this.loggingService.logError(error, { 
          method: request.method, 
          route: request.route?.path || request.path,
          requestId 
        });
        throw error;
      })
    );
  }
}
