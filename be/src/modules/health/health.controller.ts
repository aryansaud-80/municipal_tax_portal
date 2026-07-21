import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@Public()
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getApiInfo() {
    return this.healthService.getApiInfo();
  }

  @Get('/health')
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('health/live')
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('health/ready')
  getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('version')
  getVersion() {
    return this.healthService.getVersion();
  }
}
