import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString } from "class-validator"

export class AdminLoginDto {
  @IsEmail()
  @ApiProperty({ description: 'The email of the admin'})
  email: string

  @IsString()
  @ApiProperty({ description: 'The password of the admin'})
  password: string
}
