import { ApiProperty } from "@nestjs/swagger";
import { DiscountType, Status } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The voucher code',
    example: 'SUMMER2024',
  })
  code: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The course ID that voucher applies to (null for all courses)',
    example: 'uuid-string',
    required: false,
  })
  courseId?: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The discount type',
    enum: DiscountType,
    example: DiscountType.percentage,
  })
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  @ApiProperty({
    description: 'The discount value (percentage or fixed amount)',
    example: 20,
  })
  discountValue: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The start date of voucher',
    example: '2024-01-01T00:00:00.000Z',
  })
  startDate: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The end date of voucher',
    example: '2024-12-31T23:59:59.999Z',
  })
  endDate: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiProperty({
    description: 'The usage limit of voucher (null for unlimited)',
    example: 100,
    required: false,
  })
  usageLimit?: number;
}

export class UpdateVoucherDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The voucher code',
    example: 'SUMMER2024',
    required: false,
  })
  code?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The course ID that voucher applies to',
    example: 'uuid-string',
    required: false,
  })
  courseId?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  @ApiProperty({
    description: 'The discount type',
    enum: DiscountType,
    example: DiscountType.percentage,
    required: false,
  })
  discountType?: DiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    description: 'The discount value',
    example: 20,
    required: false,
  })
  discountValue?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The start date of voucher',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  startDate?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The end date of voucher',
    example: '2024-12-31T23:59:59.999Z',
    required: false,
  })
  endDate?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @ApiProperty({
    description: 'The usage limit of voucher',
    example: 100,
    required: false,
  })
  usageLimit?: number;

  @IsEnum(Status)
  @IsOptional()
  @ApiProperty({
    description: 'The status of voucher',
    enum: Status,
    example: Status.active,
    required: false,
  })
  status?: Status;
}
