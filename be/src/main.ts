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

  // CORS allowlist comes from CORS_ORIGIN (comma-separated exact origins,
  // e.g. "https://municipal-tax-admin.onrender.com,https://municipal-tax-citizen.onrender.com").
  // `credentials: true` forbids the "*" wildcard, so never fall back to it:
  // unset/empty means same-origin only (fail closed in production).
  const corsOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== "*");

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 8000);

  logger.log(`
──────────────────────────────────────────
Municipal Tax Portal API
Environment : development
Port        : 8000
URL         : http://localhost:8000
API Prefix  : /api
──────────────────────────────────────────
Application started successfully.`);
}
void bootstrap();
