import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformTransactionType } from '@prisma/client';

export class GetPlatformTransactionsDto {
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
    description: 'Filter by transaction type',
    enum: PlatformTransactionType,
  })
  @IsOptional()
  @IsEnum(PlatformTransactionType)
  type?: PlatformTransactionType;

  @ApiPropertyOptional({
    description: 'Search by user email or name',
  })
  @IsOptional()
  @IsString()
  keySearch?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['amount', 'createdAt'],
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortField?: 'amount' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
