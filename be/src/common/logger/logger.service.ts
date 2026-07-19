import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(
          ({ timestamp, level, message, context, stack }) => {
            const ctx = context || this.context || 'App';
            return stack
              ? `[${timestamp}] [${level.toUpperCase()}] [${ctx}] ${message} - ${stack}`
              : `[${timestamp}] [${level.toUpperCase()}] [${ctx}] ${message}`;
          },
        ),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}
