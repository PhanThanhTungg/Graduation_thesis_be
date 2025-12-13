import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  NotFoundException,
} from '@nestjs/common';
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
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { EnvService } from 'src/shared/env/env.service';
import { FacebookAuthGuard } from 'src/common/guards/facebook-auth.guard';

@Controller(`/auth`)
@ApiTags('Client Authentication')
export class ClientAuthController {
  constructor(
    private readonly clientAuthService: ClientAuthService,
    private readonly loggingService: LoggingService,
    private readonly envService: EnvService,
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

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {
    // This will redirect to Google
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.clientAuthService.googleLogin(req.user);

      setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken);

      const frontendUrl = this.envService.get('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/oauth/callback?token=${result.accessToken}`;

      res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = this.envService.get('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error.message)}`,
      );
    }
  }

  @Get('facebook')
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @UseGuards(FacebookAuthGuard)
  async facebookAuth(@Req() req: Request) {
    // This will redirect to Facebook
  }

  @Get('facebook/callback')
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @UseGuards(FacebookAuthGuard)
  async facebookAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      const result = await this.clientAuthService.facebookLogin(req.user);
      setCookieHttpOnly(res, 'client_refresh_token', result.refreshToken);
      const frontendUrl = this.envService.get('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/oauth/callback?token=${result.accessToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = this.envService.get('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/oauth/callback?error=${encodeURIComponent(error.message)}`,
      );
    }
  }
}
