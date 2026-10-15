import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('audit-events')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Permissions('auditLog.view')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query()
    query: {
      page?: number;
      limit?: number;
      entity?: string;
      actorId?: string;
    },
  ) {
    return this.service.findAll(query);
  }
}
