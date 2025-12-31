import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrGetConversationDto {
  @ApiProperty({
    description: 'User ID to create conversation with',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
