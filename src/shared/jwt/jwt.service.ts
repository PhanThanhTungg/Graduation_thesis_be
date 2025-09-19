import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { EnvService } from '../env/env.service'

export interface JwtPayload {
  sub: string
  email: string
  type: 'admin' | 'client'
  role?: string
  permissions?: string[]
  exp?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

@Injectable()
export class JwtAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {}

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const accessToken = await this.generateAccessToken(payload)
    const refreshToken = await this.generateRefreshToken(payload)

    return {
      accessToken,
      refreshToken,
    }
  }

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.envService.get('JWT_SECRET'),
      expiresIn: this.envService.get('JWT_EXPIRES_IN'),
    })
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(
      { sub: payload.sub, type: payload.type },
      {
        secret: this.envService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.envService.get('JWT_REFRESH_EXPIRES_IN'),
      },
    )
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.envService.get('JWT_SECRET'),
    })
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string; type: 'admin' | 'client' }> {
    return this.jwtService.verifyAsync(token, {
      secret: this.envService.get('JWT_REFRESH_SECRET'),
    })
  }
}
