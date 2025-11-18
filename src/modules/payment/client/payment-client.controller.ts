import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentClientService } from './payment-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { ClientRoleGuard, ClientRoles } from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { CaptureOrderDto } from './dto/capture-order.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';

@Controller('payment/client')
@ApiTags('Client / Payment')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class PaymentClientController {
  constructor(private readonly paymentService: PaymentClientService) {}

  @Post('orders')
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Create PayPal order for course purchase' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.paymentService.createOrder(dto, user);
  }

  @Post('orders/:orderId/capture')
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Capture PayPal payment and update order status' })
  @ApiParam({ name: 'orderId', type: String })
  async captureOrder(
    @Param('orderId') orderId: string,
    @Body() dto: CaptureOrderDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.paymentService.captureOrder(orderId, dto, user);
  }

  @Get('check-purchase')
  @ClientRoles(UserRole.student)
  @ApiOperation({ summary: 'Check if user has purchased a course' })
  @ApiQuery({ name: 'courseId', type: String, required: true })
  async checkPurchase(
    @Query('courseId') courseId: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.paymentService.checkPurchase(courseId, user);
  }
}

