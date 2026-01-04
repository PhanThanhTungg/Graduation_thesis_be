import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceClientService } from './finance-client.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import {
  ClientRoleGuard,
  ClientRoles,
} from 'src/common/guards/client-role.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { GetWithdrawalsDto } from './dto/get-withdrawals.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CaptureDepositDto } from './dto/capture-deposit.dto';

@Controller('finance/client')
@ApiTags('Client / Finance')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class FinanceClientController {
  constructor(private readonly financeService: FinanceClientService) {}

  @Get('wallet')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get wallet information for teacher' })
  async getWallet(@CurrentUser() user: currentClientUser) {
    return this.financeService.getWallet(user);
  }

  @Get('transactions')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get transaction history for teacher' })
  async getTransactions(
    @Query() dto: GetTransactionsDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.financeService.getTransactions(dto, user);
  }

  @Get('withdrawals')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get withdrawal requests for teacher' })
  async getWithdrawals(
    @Query() dto: GetWithdrawalsDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.financeService.getWithdrawals(dto, user);
  }

  @Get('orders')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get student orders for teacher courses' })
  async getOrders(
    @Query() dto: GetOrdersDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.financeService.getOrders(dto, user);
  }

  @Post('withdrawals')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Create withdrawal request' })
  async createWithdrawal(
    @Body() dto: CreateWithdrawalDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.financeService.createWithdrawal(dto, user);
  }

  @Post('deposit')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Create deposit request with PayPal' })
  async createDeposit(
    @Body() dto: CreateDepositDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.financeService.createDeposit(dto, user);
  }

  @Post('deposit/:transactionId/capture')
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Capture deposit payment and update wallet' })
  @ApiParam({ name: 'transactionId', type: String })
  async captureDeposit(
    @Param('transactionId') transactionId: string,
    @Body() dto: CaptureDepositDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.financeService.captureDeposit(transactionId, dto, user);
  }
}
