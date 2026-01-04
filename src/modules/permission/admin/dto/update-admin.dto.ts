import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateAdminDto {
  @ApiProperty({
    description: 'Admin full name',
    required: false,
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'Admin email',
    required: false,
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Role ID', required: false, example: 'uuid' })
  @IsUUID()
  @IsOptional()
  roleId?: string;
}
