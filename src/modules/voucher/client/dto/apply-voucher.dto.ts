import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ApplyVoucherDto {
  @IsString()
  @ApiProperty({
    description: 'The voucher code to apply',
    example: 'SUMMER2024',
  })
  code: string;

  @IsString()
  @ApiProperty({
    description: 'The course ID to apply voucher',
    example: 'uuid-string',
  })
  courseId: string;
}

export class ValidateVoucherResponseDto {
  @ApiProperty({
    description: 'Is voucher valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Discount type',
    example: 'percentage',
  })
  discountType?: string;

  @ApiProperty({
    description: 'Discount value',
    example: 20,
  })
  discountValue?: number;

  @ApiProperty({
    description: 'Final price after discount',
    example: 80,
  })
  finalPrice?: number;

  @ApiProperty({
    description: 'Original price',
    example: 100,
  })
  originalPrice?: number;

  @ApiProperty({
    description: 'Error message if voucher is invalid',
    example: 'Voucher has expired',
    required: false,
  })
  message?: string;
}
