import { Controller, Post, Body, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { AdminAuthService } from './admin-auth.service'
import { AdminLoginDto } from './dto/admin-auth.dto'
import { setCookieHttpOnly } from 'src/common/utils/cookie.util'
import { ADMIN_API_PREFIX } from 'src/common/constants/api.constant'
import { successResponse } from 'src/common/interfaces/response.interface'

@Controller(`${ADMIN_API_PREFIX}/auth`)
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.adminAuthService.login(loginDto)
    setCookieHttpOnly(res, 'admin_refresh_token', result.refreshToken)

    const response: successResponse = {
      message: 'Login successfully',
      data: {
        accessToken: result.accessToken,
        admin: result.admin,
      },
    }
    return response;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.adminAuthService.refreshToken(req.cookies.admin_refresh_token )
    setCookieHttpOnly(res, 'admin_refresh_token', result.refreshToken)

    const response: successResponse = {
      message: 'Refresh token successfully',
      data: {
        accessToken: result.accessToken,
      },
    }
    return response;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('admin_refresh_token')
    return { message: 'Logged out successfully' }
  }
}
