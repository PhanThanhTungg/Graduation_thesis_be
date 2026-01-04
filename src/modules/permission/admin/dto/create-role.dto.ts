import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role title', example: 'Content Manager' })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Role description',
    required: false,
    example: 'Manage courses and categories',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs',
    type: [String],
    example: ['permission-id-1', 'permission-id-2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionIds: string[];
}
