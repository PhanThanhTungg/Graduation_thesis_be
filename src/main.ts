import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { API_PREFIX } from './common/constants/api.constant';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';
import { SWAGGER_DARK_CSS } from './common/constants/swagger.constant';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(API_PREFIX);
  
  app.enableCors({
    origin: process.env.FRONTEND_CORS_ORIGIN == "true" ? true : process.env.FRONTEND_CORS_ORIGIN,
    credentials: true
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: false
  }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger documentation 
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Aikabis API')
      .setDescription('The Aikabis API description')
      .addTag('Aikabis')
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory, {
      customCss: SWAGGER_DARK_CSS,
      swaggerOptions: { persistAuthorization: true }
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
