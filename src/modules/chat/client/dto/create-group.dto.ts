import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsNotEmpty,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Name of the group',
    example: 'Study Group',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Array of user IDs to add to the group',
    example: ['user-id-1', 'user-id-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one member must be added' })
  @IsString({ each: true })
  userIds: string[];
}
