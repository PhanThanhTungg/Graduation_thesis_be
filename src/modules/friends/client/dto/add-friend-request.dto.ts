import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddFriendRequestDto {
  @ApiProperty({
    description: 'Friend ID to send friend request to',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  friendId: string;
}
