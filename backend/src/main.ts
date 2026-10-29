import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { Application } from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { NODE_ENV } from './common/enums/node-env.enum';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const SWAGGER_PATH = 'api/docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const port = config.get<number>('BACKEND_PORT');
  const isProduction = config.get<NODE_ENV>('NODE_ENV') === NODE_ENV.PRODUCTION;

  app.setGlobalPrefix('api');

  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.set('trust proxy', ['loopback', 'uniquelocal']);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const frontendOrigin = config.get<string>('FRONTEND_ORIGIN')!;
  app.enableCors({
    origin: frontendOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Chatrix API')
      .setDescription('API for the thesis chat application')
      .setVersion('0.1')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(SWAGGER_PATH, app, document);
  }

  await app.listen(port!);

  const logger = app.get(Logger);
  logger.log(`Server listening on http://localhost:${port}`, 'Bootstrap');
  if (!isProduction) {
    logger.log(
      `Swagger UI available at http://localhost:${port}/${SWAGGER_PATH}`,
      'Bootstrap',
    );
  }
}

void bootstrap();
