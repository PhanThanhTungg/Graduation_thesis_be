import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { JwtAuthService, JwtPayload } from '../../../shared/jwt/jwt.service';
import { AdminLoginDto } from './dto/admin-auth.dto';
import { successResponse } from 'src/common/interfaces/response.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtAuthService: JwtAuthService,
  ) {}

  async login(loginDto: AdminLoginDto) {
    const admin = await this.validateAdmin(loginDto.email, loginDto.password);

    const permissions = admin.adminRole.permissions.map(
      (permission) =>
        `${permission.adminPermission.object}_${permission.adminPermission.action}`,
    );

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      type: 'admin',
      role: admin.adminRole.title ?? undefined,
      permissions,
    };

    const tokens = await this.jwtAuthService.generateTokenPair(payload);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.adminRole.title,
        permissions,
      },
    };
  }

  async refreshToken(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const payload = await this.jwtAuthService.verifyRefreshToken(refreshToken);

    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid refresh token type');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    const jwtPayload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
      type: 'admin',
    };

    const tokens = await this.jwtAuthService.generateTokenPair(jwtPayload);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async validateAdmin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
      include: {
        adminRole: {
          include: {
            permissions: {
              include: {
                adminPermission: true,
              },
            },
          },
        },
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Email not found');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }
    const { passwordHash, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }
}
