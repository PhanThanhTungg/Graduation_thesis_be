import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClientAuthService } from './client-auth.service';
import {
  ClientLoginDto,
  ClientRegisterDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/client-auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { setCookieHttpOnly } from 'src/common/utils/cookie.util';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoggingService } from 'src/shared/logging/logging.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { successResponse } from 'src/common/interfaces/response.interface';

@Controller(`/auth`)
@ApiTags('Client Authentication')
export class ClientAuthController {
  constructor(
    private readonly clientAuthService: ClientAuthService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new client' })
  @ApiBody({ type: ClientRegisterDto })
  async register(
    @Body() registerDto: ClientRegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.clientAuthService.register(registerDto);
    setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken);

    const response: successResponse = {
      message: 'Register successfully',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
    return response;
  }

  @Post('login')
  async login(
    @Body() loginDto: ClientLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.clientAuthService.login(loginDto);
    setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken);

    const response: successResponse = {
      message: 'Login successfully',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
    return response;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.loggingService.log(req.cookies);
    const refreshToken = req.cookies.client_refresh_token as string | undefined;
    const result = await this.clientAuthService.refreshToken(refreshToken);
    setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken);
    const response: successResponse = {
      message: 'Refresh token successfully',
      data: {
        accessToken: result.accessToken,
      },
    };
    return response;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response): successResponse {
    res.clearCookie('client_refresh_token');
    return { message: 'Logged out successfully' };
  }

  @Post('send-verification-email')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email verification' })
  @UseGuards(AuthGuard('client-jwt'))
  async sendVerificationEmail(@CurrentUser() user: currentClientUser) {
    return await this.clientAuthService.sendVerificationEmail(user);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiBody({ type: VerifyEmailDto })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.clientAuthService.verifyEmail(verifyEmailDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.clientAuthService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.clientAuthService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
