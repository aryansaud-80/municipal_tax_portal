import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor() {}
  getApiInfo() {
    return {
      name: 'Municipal Tax Portal API',
      version: 'v1',
      environment: process.env.NODE_ENV ?? 'development',
      port: process.env.PORT ?? 3000,
      status: 'running',
      Baseurl: `http://localhost:${process.env.PORT ?? 3000}/api`,
      documentation: `/docs`,
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: '...',
      uptime: 5423,
      database: 'up',
      redis: 'up',
    };
  }

  getLiveness() {
    return {
      status: 'alive',
    };
  }
  getReadiness() {
    return {
      status: 'ready',
    };
  }
  getVersion() {
    return {
      name: 'Municipal Tax Portal',
      version: '1.0.0',
      node: '22.x',
      environment: 'development',
    };
  }
}
