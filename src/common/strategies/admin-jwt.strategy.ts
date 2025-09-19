import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { EnvService } from 'src/shared/env/env.service'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { JwtPayload } from 'src/shared/jwt/jwt.service'

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
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
    if (payload.type !== 'admin') {
      throw new UnauthorizedException('Invalid token type')
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
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
    })

    if (!admin) {
      throw new UnauthorizedException('Admin not found')
    }

    const permissions = admin.adminRole.permissions.map(
      (permission) => `${permission.adminPermission.object}_${permission.adminPermission.action}`,
    )

    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.adminRole.title,
      permissions,
    }
  }
}
