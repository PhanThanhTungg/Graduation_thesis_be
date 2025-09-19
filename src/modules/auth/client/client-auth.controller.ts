import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { ClientAuthService } from './client-auth.service'
import { ClientLoginDto, ClientRegisterDto } from './dto/client-auth.dto'
import { AuthGuard } from '@nestjs/passport'
import { setCookieHttpOnly } from 'src/common/utils/cookie.util'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'

@Controller('client/auth')
export class ClientAuthController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Post('register')
  async register(@Body() registerDto: ClientRegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.clientAuthService.register(registerDto)
    setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken)
    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('login')
  async login(@Body() loginDto: ClientLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.clientAuthService.login(loginDto)
    setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken)
    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.clientAuthService.refreshToken(req.cookies.client_refresh_token)
    setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken)
    return {
      accessToken: result.accessToken,
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('client-jwt'))
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('client_refresh_token')
    return { message: 'Logged out successfully' }
  }
}
