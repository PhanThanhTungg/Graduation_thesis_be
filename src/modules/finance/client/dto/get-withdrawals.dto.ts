import { IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class GetWithdrawalsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by withdrawal status',
    enum: TransactionStatus,
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
