import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { EnvService } from 'src/shared/env/env.service'
import { JwtPayload } from 'src/shared/jwt/jwt.service'
import { PrismaService } from 'src/shared/prisma/prisma.service'

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
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        emailVerified: true,
        avatarUrl: true,
        status: true,
        country: true
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive')
    }

    return user;
  }
}
