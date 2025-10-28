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
import { User } from '@prisma/client';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { EmailService } from 'src/shared/email/email.service';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class ClientAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtAuthService: JwtAuthService,
    private readonly loggingService: LoggingService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: ClientRegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName,
        email: registerDto.email,
        passwordHash,
        role: UserRole.student,
        country: registerDto.country,
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

    if (user.status !== 'active') {
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is inactive');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
