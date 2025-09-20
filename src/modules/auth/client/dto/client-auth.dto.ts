import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, Matches, MinLength } from "class-validator"

export class ClientLoginDto {
  @IsEmail()
  @ApiProperty({ description: 'The email of the client'})
  email: string

  @IsString()
  @ApiProperty({ description: 'The password of the client'})
  password: string
}

export class ClientRegisterDto {
  @IsString({ message: 'full name must be a string' })
  @MinLength(4, { message: 'full name must be at least 4 characters' })
  @ApiProperty({ description: 'The full name of the client'})
  fullName: string

  @IsEmail()
  @ApiProperty({ description: 'The email of the client'})
  email: string

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character'
  })
  @ApiProperty({ description: 'Contains at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character' })
  password: string

  @IsString()
  @ApiProperty({ description: 'The country of the client is got from API'})
  country: string
}