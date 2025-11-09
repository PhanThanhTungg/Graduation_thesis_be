import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EnvService } from '../env/env.service';
import { LoggingService } from '../logging/logging.service';
import { getEmailVerificationTemplate } from './templates/email_verification.template';
import { getPasswordResetTemplate } from './templates/password_reset.template';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly envService: EnvService,
    private readonly loggingService: LoggingService
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.envService.get('EMAIL_HOST'),
      port: this.envService.get('EMAIL_PORT'),
      secure: false,
      auth: {
        user: this.envService.get('EMAIL_USER'),
        pass: this.envService.get('EMAIL_PASS'),
      },
    });
  }

  async sendEmailVerification(email: string, token: string, fullName: string) {
    const verificationUrl = `${this.envService.get('FRONTEND_URL')}verify-email?token=${token}`;
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${this.envService.get('APP_NAME')}" <${this.envService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Verify your email',
      html: getEmailVerificationTemplate(fullName, verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.loggingService.log(`Email verification sent to ${email}`);
      return true;
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string, fullName: string) {
    const resetUrl = `${this.envService.get('FRONTEND_URL')}reset-password?token=${token}`;
    
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${this.envService.get('APP_NAME')}" <${this.envService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Reset your password',
      html: getPasswordResetTemplate(fullName, resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.loggingService.log(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

