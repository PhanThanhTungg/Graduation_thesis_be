import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, Matches, MinLength, IsNotEmpty, IsOptional } from "class-validator"

export class ClientLoginDto {
  @IsEmail()
  @ApiProperty({ description: 'The email of the client', example: 'tung5@gmail.com' })
  email: string

  @IsString()
  @ApiProperty({ description: 'The password of the client', example: 'Tt123456@' })
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

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The timezone of the client', required: false, example: 'Asia/Ho_Chi_Minh' })
  timezone?: string

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Google reCAPTCHA v3 token', required: true })
  recaptchaToken: string
}


export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The verification token' })
  token: string
}

export class ForgotPasswordDto {
  @IsEmail()
  @ApiProperty({ description: 'The email of the user', example: 'user@example.com' })
  email: string
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The password reset token' })
  token: string

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character'
  })
  @ApiProperty({ description: 'The new password. Contains at least 1 lowercase letter, 1 uppercase letter, 1 number and 1 special character' })
  newPassword: string
}