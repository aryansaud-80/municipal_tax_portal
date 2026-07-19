import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/validation';
import { LoggerService } from './common/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = await app.resolve(LoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  app.useGlobalPipes(AppValidationPipe);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);

  logger.log(`
──────────────────────────────────────────
Municipal Tax Portal API
Environment : development
Port        : 3000
URL         : http://localhost:3000
API Prefix  : /api
──────────────────────────────────────────
Application started successfully.`);
}
bootstrap();
