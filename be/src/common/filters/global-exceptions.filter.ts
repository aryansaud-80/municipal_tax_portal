import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (this.isUniqueViolation(exception)) {
      status = HttpStatus.CONFLICT;
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.extractMessage(exception, exceptionResponse);
    const messageText = Array.isArray(message) ? message.join(', ') : message;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} - ${messageText}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(
    exception: unknown,
    exceptionResponse: string | object | null,
  ): string | string[] {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      return (exceptionResponse as { message: string | string[] }).message;
    }

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (this.isUniqueViolation(exception)) {
      return 'Resource already exists or constraint violation occurred';
    }

    return exception instanceof Error
      ? exception.message
      : 'Internal server error';
  }

  private isUniqueViolation(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object' || !('code' in exception)) {
      return false;
    }
    return exception.code === '23505';
  }
}
