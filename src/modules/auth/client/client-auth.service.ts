import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtAuthService, JwtPayload } from '../../../shared/jwt/jwt.service';
import {
  ClientLoginDto,
  ClientRegisterDto,
  VerifyEmailDto,
} from './dto/client-auth.dto';
import { UserRole } from 'src/common/enums/common.enum';
import { LoggingService } from 'src/shared/logging/logging.service';
import { randomBytes } from 'crypto';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { EmailService } from 'src/shared/email/email.service';
import { successResponse } from 'src/common/interfaces/response.interface';
import { RecaptchaService } from 'src/shared/recaptcha/recaptcha.service';
import { isUserInactive } from 'src/common/utils/user-status.util';

@Injectable()
export class ClientAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly loggingService: LoggingService,
    private readonly emailService: EmailService,
    private readonly recaptchaService: RecaptchaService,
  ) {}

  async register(registerDto: ClientRegisterDto) {
    // Verify reCAPTCHA token first
    await this.recaptchaService.verifyToken(
      registerDto.recaptchaToken,
      'register',
    );

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: registerDto.fullName,
          email: registerDto.email,
          passwordHash,
          role: UserRole.student,
          country: registerDto.country,
          timezone: registerDto.timezone,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          emailVerified: true,
          avatarUrl: true,
          status: true,
          country: true,
          timezone: true,
        },
      });

      await tx.studentSetting.create({
        data: {
          userId: user.id,
        },
      });

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        type: 'client',
        role: UserRole.student,
      };
      const tokens = await this.jwtAuthService.generateTokenPair(payload);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user,
      };
    });
  }

  async login(loginDto: ClientLoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'client',
      role: user.role,
    };

    const tokens = await this.jwtAuthService.generateTokenPair(payload);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
        status: user.status,
        country: user.country,
      },
    };
  }

  async refreshToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const payload = await this.jwtAuthService.verifyRefreshToken(refreshToken);

    if (payload.type !== 'client') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (isUserInactive(user.status)) {
      throw new UnauthorizedException('Account is inactive');
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'client',
      role: user.role,
    };

    const tokens = await this.jwtAuthService.generateTokenPair(jwtPayload);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async sendVerificationEmail(user: currentClientUser) {
    if (user.emailVerified)
      throw new BadRequestException('Email already verified');

    await this.prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    const token = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const isSent = await this.emailService.sendEmailVerification(
      user.email,
      token,
      user.fullName,
    );
    if (!isSent) {
      throw new BadRequestException('Failed to send email verification');
    }

    const response: successResponse = {
      message: 'Email verification sent successfully',
    };
    return response;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { token: verifyEmailDto.token },
        include: { user: true },
      });

    if (!verificationToken) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new BadRequestException(
        'Token verification has expired. Please request to resend email verification',
      );
    }

    if (verificationToken.user.emailVerified) {
      throw new BadRequestException('Email has already been verified');
    }

    await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    const response: successResponse = {
      message: 'Email has been verified successfully',
    };
    return response;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    if (isUserInactive(user.status)) {
      throw new BadRequestException('Account is inactive');
    }

    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const token = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    const isSent = await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
      user.fullName,
    );

    if (!isSent) {
      throw new BadRequestException('Failed to send password reset email');
    }

    const response: successResponse = {
      message: 'Password reset email sent successfully',
    };
    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new NotFoundException('Invalid reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException(
        'Reset token has expired. Please request a new password reset',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    const response: successResponse = {
      message: 'Password has been reset successfully',
    };
    return response;
  }

  async googleLogin(googleUser: any) {
    const { email, fullName, avatarUrl, googleId } = googleUser;
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { googleId: googleId }],
      },
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleId,
            avatarUrl: avatarUrl || user.avatarUrl,
            emailVerified: true, // Auto verify email for Google users
          },
        });
      }
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          avatarUrl,
          googleId,
          emailVerified: true,
          role: UserRole.student, // Default role
          country: 'Unknown', // You can get this from Google API later
          passwordHash: '', // No password hash needed for Google users
          timezone: null,
        },
      });
    }

    // Generate JWT tokens
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'client',
      role: user.role,
    };

    const tokens = await this.jwtAuthService.generateTokenPair(jwtPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async facebookLogin(facebookUser: any) {
    const { email, fullName, avatarUrl, facebookId } = facebookUser;
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { facebookId: facebookId }],
      },
    });

    if (user) {
      // Update existing user with Facebook ID if not set
      if (!user.facebookId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            facebookId: facebookId,
            avatarUrl: avatarUrl || user.avatarUrl,
            emailVerified: true, // Auto verify email for Facebook users
          },
        });
      }
    } else {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          fullName,
          avatarUrl,
          facebookId,
          emailVerified: true,
          role: UserRole.student, // Default role
          country: 'Unknown', // You can get this from Facebook API later
          passwordHash: '', // No password hash needed for Facebook users
          timezone: null,
        },
      });
    }

    // Generate JWT tokens
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: 'client',
      role: user.role,
    };

    const tokens = await this.jwtAuthService.generateTokenPair(jwtPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async checkUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  }

  async findUserByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        studentSetting: {
          telegramId,
        },
      },
    });
    return user;
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Please use social login for this account.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    if (isUserInactive(user.status)) {
      throw new UnauthorizedException('Account is inactive');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
