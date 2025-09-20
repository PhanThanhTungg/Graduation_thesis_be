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

  @IsString()
  JWT_EXPIRES_IN: string

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string

  @IsString()
  FRONTEND_CORS_ORIGIN: string

  // Logging config
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
}
