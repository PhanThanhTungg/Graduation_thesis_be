import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  Min,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

enum Environment {
  test = 'test',
  local = 'local',
  production = 'production',
}

export class EnvSchema {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  DEPLOY_URL: string;

  // JWT API
  @IsString()
  JWT_SECRET: string;
  @IsString()
  JWT_REFRESH_SECRET: string;
  @IsNumber()
  JWT_EXPIRES_IN: number;
  @IsNumber()
  JWT_REFRESH_EXPIRES_IN: number;

  @IsString()
  FRONTEND_CORS_ORIGIN: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string = 'info';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  LOG_SAMPLE_PCT?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  LOG_SLOW_MS?: number = 1000;

  @IsOptional()
  @IsString()
  LOG_FILE_PATH?: string;

  // Email API
  @IsString()
  EMAIL_HOST: string = 'smtp.gmail.com';
  @IsNumber()
  EMAIL_PORT: number = 587;
  @IsString()
  EMAIL_USER: string;
  @IsString()
  EMAIL_PASS: string;
  @IsString()
  FRONTEND_URL: string;

  @IsOptional()
  @IsString()
  APP_NAME?: string = 'Aikabis';

  @IsString()
  RECAPTCHA_SECRET_KEY: string;

  // PayPal API
  @IsString()
  PAYPAL_CLIENTID: string;
  @IsString()
  PAYPAL_SECRET: string;
  @IsString()
  PAYPAL_BASEURL: string;
  @IsString()
  PAYPAL_REDIRECT_BASE_URL: string;

  // Google OAuth
  @IsString()
  GOOGLE_CLIENT_ID: string;
  @IsString()
  GOOGLE_CLIENT_SECRET: string;
  @IsString()
  BACKEND_URL: string;

  // Facebook OAuth
  @IsString()
  FACEBOOK_CLIENT_ID: string;
  @IsString()
  FACEBOOK_CLIENT_SECRET: string;

  // Gemini API
  @IsString()
  GEMINI_API_KEY: string;
  @IsNumber()
  GEMINI_TEMPERATURE: number;
  @IsNumber()
  GEMINI_MAX_TOKEN: number;

  // Groq API
  @IsString()
  GROQ_API_KEY: string;
  @IsNumber()
  GROQ_TEMPERATURE: number;
  @IsNumber()
  GROQ_MAX_TOKEN: number;

  // BOT
  // Telegram Bot Token
  @IsString()
  TELE_BOT_TOKEN: string;

  // Redis
  @IsString()
  @IsNotEmpty()
  REDIS_URI: string;

  // RabbitMQ
  @IsString()
  @IsNotEmpty()
  AMQP_URI: string;
}
