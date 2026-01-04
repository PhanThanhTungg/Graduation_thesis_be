import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Role title',
    required: false,
    example: 'Content Manager',
  })
  @IsString()
  @IsOptional()
  title?: string;

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
    required: false,
    example: ['permission-id-1', 'permission-id-2'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  permissionIds?: string[];
}
