import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { AdminAuthService } from './admin-auth.service'
import { AdminLoginDto } from './dto/admin-auth.dto'
import { AuthGuard } from '@nestjs/passport'
import { setCookieHttpOnly } from 'src/common/utils/cookie.util'
import { ADMIN_API_PREFIX } from 'src/common/constants/api.constant'

@Controller(`${ADMIN_API_PREFIX}/auth`)
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.adminAuthService.login(loginDto)
    setCookieHttpOnly(res, 'admin_refresh_token', result.refreshToken)
    return {
      accessToken: result.accessToken,
      admin: result.admin,
    }
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.adminAuthService.refreshToken(req.cookies.admin_refresh_token )
    setCookieHttpOnly(res, 'admin_refresh_token', result.refreshToken)
    return {
      accessToken: result.accessToken,
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard('admin-jwt'))
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_refresh_token')
    return { message: 'Logged out successfully' }
  }
}
