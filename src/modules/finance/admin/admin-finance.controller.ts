import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminObject, AdminAction } from '@prisma/client';
import { AdminPermissionGuard } from 'src/common/guards/admin-permission.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { successResponse } from 'src/common/interfaces/response.interface';
import { AdminFinanceService } from './admin-finance.service';
import { GetPlatformTransactionsDto } from './dto/get-platform-transactions.dto';
import { GetWithdrawalsDto } from './dto/get-withdrawals.dto';
import { PlatformTransactionType, TransactionStatus } from '@prisma/client';

@ApiTags('Admin - Finance')
@Controller('admin/finance')
@UseGuards(AuthGuard('admin-jwt'), AdminPermissionGuard)
@ApiBearerAuth()
export class AdminFinanceController {
  constructor(private readonly adminFinanceService: AdminFinanceService) {}

  @Get('transactions')
  @ApiOperation({
    summary: 'Get all platform transactions with pagination and filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: PlatformTransactionType,
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'keySearch',
    required: false,
    description: 'Search by user email or name',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    enum: ['amount', 'createdAt'],
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @RequirePermissions({
    object: AdminObject.transaction,
    action: AdminAction.view,
  })
  async getPlatformTransactions(
    @Query() dto: GetPlatformTransactionsDto,
  ): Promise<successResponse> {
    return this.adminFinanceService.getPlatformTransactions(dto);
  }

  @Get('withdrawals')
  @ApiOperation({
    summary: 'Get all withdrawal requests with pagination and filters',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TransactionStatus,
    description: 'Filter by withdrawal status',
  })
  @ApiQuery({
    name: 'keySearch',
    required: false,
    description: 'Search by teacher email or name',
  })
  @ApiQuery({
    name: 'sortField',
    required: false,
    enum: ['amount', 'createdAt'],
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @RequirePermissions({ object: AdminObject.payment, action: AdminAction.view })
  async getWithdrawals(
    @Query() dto: GetWithdrawalsDto,
  ): Promise<successResponse> {
    return this.adminFinanceService.getWithdrawals(dto);
  }
}
