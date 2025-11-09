import { SetMetadata } from '@nestjs/common';
import { RECAPTCHA_ACTION } from '../guards/recaptcha.guard';

export const RecaptchaAction = (action: string) =>
  SetMetadata(RECAPTCHA_ACTION, action);
