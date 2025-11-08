import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Status } from '@prisma/client';

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'User status',
    enum: Status,
    example: 'active',
  })
  @IsEnum(Status, { message: 'Status must be one of: active, warining, inactive' })
  @IsNotEmpty({ message: 'Status is required' })
  status: Status;
}
