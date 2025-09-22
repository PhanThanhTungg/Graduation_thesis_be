import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Status, TeacherSetting, UserRole } from '@prisma/client'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { EnvService } from 'src/shared/env/env.service'
import { JwtPayload } from 'src/shared/jwt/jwt.service'
import { PrismaService } from 'src/shared/prisma/prisma.service'

export interface currentClientUser {
  id: string,
  fullName: string,
  email: string,
  role: UserRole,
  emailVerified: boolean | null,
  avatarUrl: string | null,
  status: Status,
  country: string,
  teacherSetting: TeacherSetting | null,
}

@Injectable()
export class ClientJwtStrategy extends PassportStrategy(Strategy, 'client-jwt') {
  constructor(
    private readonly envService: EnvService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envService.get('JWT_SECRET'),
    })
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'client') {
      throw new UnauthorizedException('Invalid token type')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive')
    }

    const currentClientUser: currentClientUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      status: user.status,
      country: user.country,
      teacherSetting: user["teacherSetting"],
    }

    return currentClientUser;
  }
}
