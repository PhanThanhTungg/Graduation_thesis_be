import { IsNumber, IsEmail, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'Withdrawal amount',
    example: 100000,
    type: Number,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'PayPal email address to receive money',
    example: 'teacher@example.com',
    type: String,
  })
  @IsEmail()
  @IsString()
  email: string;

  @ApiPropertyOptional({
    description: 'Optional note',
    example: 'Monthly withdrawal',
    type: String,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
