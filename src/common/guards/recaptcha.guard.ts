import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RecaptchaService } from 'src/shared/recaptcha/recaptcha.service';

export const RECAPTCHA_ACTION = 'recaptcha_action';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(
    private readonly recaptchaService: RecaptchaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const expectedAction = this.reflector.get<string>(
      RECAPTCHA_ACTION,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const recaptchaToken = request.body?.recaptchaToken;

    if (!recaptchaToken) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    await this.recaptchaService.verifyToken(recaptchaToken, expectedAction);

    return true;
  }
}
