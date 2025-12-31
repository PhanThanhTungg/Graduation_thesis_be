import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RemoveMemberDto {
  @ApiProperty({
    description: 'User ID of the member to remove',
    example: 'user-id',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
