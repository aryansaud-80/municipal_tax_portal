import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AuditEntry {
  userId: string | null;
  action: string;
  entity: string;
  timestamp: Date;
  ipAddress: string;
}


@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
      return next.handle();
    }

    const entry: AuditEntry = {
      userId: request.user?.id ?? null,
      action: `${request.method} ${request.route?.path ?? request.originalUrl}`,
      entity: this.extractEntityName(request.originalUrl),
      timestamp: new Date(),
      ipAddress: request.ip,
    };

    return next.handle().pipe(tap(() => this.record(entry)));
  }

  private record(entry: AuditEntry): void {
    // TODO: replace with AuditLogService.create(entry) once the
    // AuditLog module exists.
    this.logger.log(JSON.stringify(entry));
  }

  private extractEntityName(url: string): string {
    const segments = url.split('/').filter(Boolean);
    return segments[0] ?? 'unknown';
  }
}