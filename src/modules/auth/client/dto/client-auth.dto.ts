import { IsEmail, IsString, Matches, MinLength } from "class-validator"

export class ClientLoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class ClientRegisterDto {
  @IsString()
  @MinLength(4, { message: 'full name must be at least 4 characters' })
  fullName: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character'
  })
  password: string

  @IsString()
  country: string
}