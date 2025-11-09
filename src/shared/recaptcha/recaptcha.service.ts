import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from 'src/shared/logging/logging.service';
import { EnvService } from '../env/env.service';

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  private readonly minScore = 0.5; // Minimum score to consider as human

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly envService: EnvService
    ,
  ) {
    this.secretKey = this.envService.get('RECAPTCHA_SECRET_KEY');
    if (!this.secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY is not configured');
    }
  }

  async verifyToken(token: string, expectedAction?: string): Promise<boolean> {
    if (!token) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    try {
      const response = await fetch(this.verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${this.secretKey}&response=${token}`,
      });

      const data: RecaptchaResponse = await response.json();

      if (!data.success) {
        const errorCodes = data['error-codes']?.join(', ') || 'Unknown error';
        this.loggingService.error(`reCAPTCHA verification failed: ${errorCodes}`);
        throw new BadRequestException('reCAPTCHA verification failed');
      }

      // Check score (v3 only)
      if (data.score < this.minScore) {
        this.loggingService.warn(
          `reCAPTCHA score too low: ${data.score} (minimum: ${this.minScore})`,
        );
        throw new BadRequestException(
          'Security check failed. Please try again.',
        );
      }

      // Check action if provided (v3 only)
      if (expectedAction && data.action !== expectedAction) {
        this.loggingService.warn(
          `reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`,
        );
        throw new BadRequestException('Invalid reCAPTCHA action');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.loggingService.error('Error verifying reCAPTCHA:', error);
      throw new BadRequestException('Failed to verify reCAPTCHA');
    }
  }

  async verifyTokenSilent(token: string): Promise<boolean> {
    try {
      await this.verifyToken(token);
      return true;
    } catch (error) {
      this.loggingService.warn('reCAPTCHA verification failed silently:', error.message);
      return false;
    }
  }
}
