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
}
