import { IsEmail, IsString } from "class-validator"

export class AdminLoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class AuthResponseDto {
  accessToken: string
  user: {
    id: string
    email: string
    fullName: string
    role?: string
    permissions?: string[]
  }
}