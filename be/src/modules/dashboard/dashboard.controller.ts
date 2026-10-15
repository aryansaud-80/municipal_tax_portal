import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Permissions('dashboard.view')
  @HttpCode(HttpStatus.OK)
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('citizen')
  @Permissions('propertyTax.view')
  @HttpCode(HttpStatus.OK)
  async getCitizenDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getCitizenDashboard(userId);
  }
}
