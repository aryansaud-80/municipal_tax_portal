import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('revenue-by-category')
  @Permissions('report.view')
  @HttpCode(HttpStatus.OK)
  async revenueByCategory(@Query('fiscalYear') fiscalYear?: string) {
    return this.service.revenueByCategory(fiscalYear);
  }

  @Get('revenue-by-period')
  @Permissions('report.view')
  @HttpCode(HttpStatus.OK)
  async revenueByPeriod(@Query('fiscalYear') fiscalYear?: string) {
    return this.service.revenueByPeriod(fiscalYear);
  }

  @Get('outstanding')
  @Permissions('report.view')
  @HttpCode(HttpStatus.OK)
  async outstanding(@Query('limit') limit?: number) {
    return this.service.outstanding(limit ? Number(limit) : undefined);
  }

  @Get('overdue')
  @Permissions('report.view')
  @HttpCode(HttpStatus.OK)
  async overdue() {
    return this.service.overdue();
  }

  @Get('collections')
  @Permissions('report.view')
  @HttpCode(HttpStatus.OK)
  async collections(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.collections(from, to);
  }

  @Get('verification')
  @Permissions('report.view')
  @HttpCode(HttpStatus.OK)
  async verification() {
    return this.service.verificationQueue();
  }

  @Get('employee-actions')
  @Permissions('auditLog.view')
  @HttpCode(HttpStatus.OK)
  async employeeActions(@Query('limit') limit?: number) {
    return this.service.employeeActions(limit ? Number(limit) : undefined);
  }
}
