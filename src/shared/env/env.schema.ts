import { IsEnum, IsNumber, IsString, Max, Min, IsOptional } from 'class-validator'

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

  @IsNumber()
  JWT_EXPIRES_IN: number

  @IsNumber()
  JWT_REFRESH_EXPIRES_IN: number

  @IsString()
  FRONTEND_CORS_ORIGIN: string

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string = 'info'

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  LOG_SAMPLE_PCT?: number = 1

  @IsOptional()
  @IsNumber()
  @Min(0)
  LOG_SLOW_MS?: number = 1000

  @IsOptional()
  @IsString()
  LOG_FILE_PATH?: string

  @IsString()
  EMAIL_HOST: string = 'smtp.gmail.com'

  @IsNumber()
  EMAIL_PORT: number = 587

  @IsString()
  EMAIL_USER: string

  @IsString()
  EMAIL_PASS: string

  @IsString()
  FRONTEND_URL: string

  @IsOptional()
  @IsString()
  APP_NAME?: string = 'Aikabis'

  @IsString()
  RECAPTCHA_SECRET_KEY: string

  @IsString()
  PAYPAL_CLIENTID: string

  @IsString()
  PAYPAL_SECRET: string

  @IsString()
  PAYPAL_BASEURL: string

  @IsString()
  PAYPAL_REDIRECT_BASE_URL: string
}
