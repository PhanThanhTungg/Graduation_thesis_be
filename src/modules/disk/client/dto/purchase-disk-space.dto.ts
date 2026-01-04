import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseDiskSpaceDto {
  @ApiProperty({
    description: 'Disk space value in MB',
    example: 1000,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  value: number;

  @ApiProperty({
    description: 'Number of months',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  months: number;
}
