import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { VoucherClientService } from './voucher-client.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UniversalAuthGuard } from 'src/common/guards/universal-auth.guard';
import { UserRole } from 'src/common/enums/common.enum';
import { ClientRoleGuard, ClientRoles } from 'src/common/guards/client-role.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { currentClientUser } from 'src/common/strategies/client-jwt.strategy';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/voucher.dto';
import { ApplyVoucherDto } from './dto/apply-voucher.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('voucher')
@ApiTags('Client / Voucher')
@ApiBearerAuth()
@UseGuards(UniversalAuthGuard, ClientRoleGuard)
export class VoucherClientController {
  constructor(private readonly voucherService: VoucherClientService) {}

  // Public routes
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get voucher by id' })
  @ApiParam({ name: 'id', type: String, required: true })
  async getVoucherById(@Param('id') id: string) {
    return this.voucherService.getVoucherById(id);
  }

  @Get('course/:courseId')
  @Public()
  @ApiOperation({ 
    summary: 'Get all active vouchers by course id',
    description: 'Get all active vouchers applicable to a specific course (includes course-specific and general vouchers)'
  })
  @ApiParam({ name: 'courseId', type: String, required: true })
  async getVouchersByCourseId(@Param('courseId') courseId: string) {
    return this.voucherService.getVouchersByCourseId(courseId);
  }

  @Post('apply')
  @Public()
  @ApiOperation({ 
    summary: 'Apply voucher to a course',
    description: 'Validate and calculate discount for a voucher code on a specific course'
  })
  async applyVoucher(@Body() dto: ApplyVoucherDto) {
    return this.voucherService.applyVoucher(dto);
  }

  // Teacher routes
  @Get('teacher-area/my-vouchers')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Get all my vouchers (teacher area)' })
  async getMyVouchers(@CurrentUser() user: currentClientUser) {
    return this.voucherService.getMyVouchers(user);
  }

  @Post('teacher-area')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Create a new voucher (teacher area)' })
  async createVoucher(
    @Body() createVoucherDto: CreateVoucherDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.voucherService.createVoucher(createVoucherDto, user);
  }

  @Patch('teacher-area/:id')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Update voucher by id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  async updateVoucher(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.voucherService.updateVoucher(id, updateVoucherDto, user);
  }

  @Delete('teacher-area/:id')
  @ApiBearerAuth()
  @ClientRoles(UserRole.teacher)
  @ApiOperation({ summary: 'Delete voucher by id (teacher area)' })
  @ApiParam({ name: 'id', type: String, required: true })
  async deleteVoucher(
    @Param('id') id: string,
    @CurrentUser() user: currentClientUser,
  ) {
    return this.voucherService.deleteVoucher(id, user);
  }
}
