import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly noisyPaths = ['/health', '/ready', '/metrics', '/docs', '/docs-admin', '/swagger'];
  private readonly sensitiveFields = ['password', 'token', 'authorization', 'cookie', 'secret', 'key'];
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        this.isDev ? this.getPrettyFormat() : winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        ...(process.env.LOG_FILE_PATH ? [new winston.transports.File({ 
          filename: process.env.LOG_FILE_PATH,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        })] : [])
      ]
    });
  }

  private getPrettyFormat() {
    return winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    );
  }

  logHttpRequest(req: any, res: any, startTime: number, requestId: string, userId?: string) {
    const latency = Date.now() - startTime;
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    if (this.noisyPaths.some(path => route.includes(path))) return;

    const shouldLog = statusCode >= 500 || 
                     [401, 403, 409, 429].includes(statusCode) ||
                     latency >= (parseInt(process.env.LOG_SLOW_MS || '1000')) ||
                     this.shouldSample(route);

    if (!shouldLog) return;

    const logData = {
      requestId,
      userId,
      method,
      route,
      statusCode,
      latency,
      userAgent: req.get('User-Agent'),
      ip: this.getClientIp(req),
      ...(statusCode >= 400 && { error: res.error })
    };

    if (this.isDev) {
      const statusColor = this.getStatusColor(statusCode);
      const methodColor = this.getMethodColor(method);
      const latencyColor = latency >= parseInt(process.env.LOG_SLOW_MS || '1000') ? '\x1b[31m' : '\x1b[32m';
      const message = `${methodColor}${method}\x1b[0m ${route} ${statusColor}${statusCode}\x1b[0m ${latencyColor}${latency}ms\x1b[0m ${requestId}${userId ? ` [${userId}]` : ''}`;
      this.logger[this.getLogLevel(statusCode)](message, logData);
    } else {
      this.logger[this.getLogLevel(statusCode)]({ message: 'HTTP Request', ...logData });
    }
  }

  logBusinessEvent(event: string, data: any, userId?: string, requestId?: string) {
    const logData = {
      requestId: requestId || uuidv4(),
      userId,
      event,
      data: this.redactSensitiveData(data)
    };

    if (this.isDev) {
      const message = `\x1b[36m📊 Business Event\x1b[0m: ${event}${userId ? ` [${userId}]` : ''}`;
      this.logger.info(message, logData);
    } else {
      this.logger.info({ message: 'Business Event', ...logData });
    }
  }

  logError(error: Error, context?: any, requestId?: string) {
    const logData = {
      requestId: requestId || uuidv4(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      ...context
    };

    if (this.isDev) {
      const message = `\x1b[31m❌ Error\x1b[0m: ${error.name} - ${error.message}`;
      this.logger.error(message, logData);
    } else {
      this.logger.error({ message: 'Application Error', ...logData });
    }
  }

  log(message: any, context?: string) {
    if (this.isDev) {
      this.logger.info(`\x1b[32mℹ️\x1b[0m ${message}${context ? ` [${context}]` : ''}`);
    } else {
      this.logger.info({ message, context });
    }
  }

  error(message: any, trace?: string, context?: string) {
    if (this.isDev) {
      this.logger.error(`\x1b[31m❌\x1b[0m ${message}${context ? ` [${context}]` : ''}`, { trace });
    } else {
      this.logger.error({ message, trace, context });
    }
  }

  warn(message: any, context?: string) {
    if (this.isDev) {
      this.logger.warn(`\x1b[33m⚠️\x1b[0m ${message}${context ? ` [${context}]` : ''}`);
    } else {
      this.logger.warn({ message, context });
    }
  }

  debug(message: any, context?: string) {
    if (this.isDev) {
      this.logger.debug(`\x1b[36m🐛\x1b[0m ${message}${context ? ` [${context}]` : ''}`);
    } else {
      this.logger.debug({ message, context });
    }
  }

  verbose(message: any, context?: string) {
    if (this.isDev) {
      this.logger.verbose(`\x1b[35m📝\x1b[0m ${message}${context ? ` [${context}]` : ''}`);
    } else {
      this.logger.verbose({ message, context });
    }
  }

  private shouldSample(route: string): boolean {
    const samplePct = parseInt(process.env.LOG_SAMPLE_PCT || '1');
    if (samplePct >= 100) return true;
    if (samplePct <= 0) return false;
    
    const hash = route.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    return Math.abs(hash) % 100 < samplePct;
  }

  private getLogLevel(statusCode: number): string {
    return statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  }

  private getClientIp(req: any): string {
    return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';
  }

  private redactSensitiveData(obj: any): any {
    if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.redactSensitiveData(item));

    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      redacted[key] = this.sensitiveFields.some(field => key.toLowerCase().includes(field)) 
        ? '[REDACTED]' 
        : this.redactSensitiveData(value);
    }
    return redacted;
  }

  private getStatusColor(statusCode: number): string {
    return statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : statusCode >= 300 ? '\x1b[36m' : '\x1b[32m';
  }

  private getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      'GET': '\x1b[32m', 'POST': '\x1b[33m', 'PUT': '\x1b[34m', 
      'DELETE': '\x1b[31m', 'PATCH': '\x1b[35m'
    };
    return colors[method] || '\x1b[37m';
  }
}
