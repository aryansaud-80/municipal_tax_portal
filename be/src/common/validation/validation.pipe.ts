import { ValidationPipe } from '@nestjs/common';
import { validationExceptionFactory } from './validation.exception.factory';

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: validationExceptionFactory,
});
