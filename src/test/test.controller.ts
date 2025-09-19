import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('test')
export class TestController {

  @Get("/admin-login")
  @UseGuards(AuthGuard('admin-jwt'))
  async test(@CurrentUser() admin: any) {
    return {
      message: 'Test successful',
      user: admin,
    }
  }

  @Get("/client-login")
  @UseGuards(AuthGuard('client-jwt'))
  async testClient() {
    return {
      message: 'Test successful',
    }
  }
}
