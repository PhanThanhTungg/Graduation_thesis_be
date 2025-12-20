import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: 'uuid-string',
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, how are you?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
