import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CaptureDepositDto {
  @ApiProperty({
    description: 'PayPal order ID from capture',
    example: '5O190127TN364715T',
  })
  @IsString()
  @IsNotEmpty()
  paypalOrderId: string;
}
