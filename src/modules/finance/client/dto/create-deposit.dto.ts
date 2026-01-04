import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepositDto {
  @ApiProperty({
    description: 'Deposit amount',
    example: 100000,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;
}
