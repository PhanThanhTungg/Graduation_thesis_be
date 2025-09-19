import { IsEnum, IsNumber, IsString, Max, Min } from 'class-validator'

enum Environment {
  test = 'test',
  local = 'local',
  production = 'production',
}

export class EnvSchema {
  @IsEnum(Environment)
  NODE_ENV: Environment

  @IsString()
  DATABASE_URL: string

  @IsString()
  JWT_SECRET: string

  @IsString()
  JWT_REFRESH_SECRET: string

  @IsString()
  JWT_EXPIRES_IN: string

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string

  @IsString()
  FRONTEND_CORS_ORIGIN: string
}
