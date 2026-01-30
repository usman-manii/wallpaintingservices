import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { EnvironmentValidator } from '../common/guards/env-validation';

/**
 * Health check controller for monitoring application status
 * Used by load balancers and monitoring systems
 */
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  /**
   * Basic health check - returns 200 if application is running
   */
  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
    ]);
  }

  /**
   * Detailed health information including environment config
   */
  @Get('info')
  @Public()
  getInfo() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: EnvironmentValidator.getInfo(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };
  }

  /**
   * Readiness probe - checks if app is ready to serve traffic
   */
  @Get('ready')
  @Public()
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected' };
    } catch (error) {
      return { status: 'not ready', database: 'disconnected', error: error.message };
    }
  }

  /**
   * Liveness probe - checks if app is alive
   */
  @Get('live')
  @Public()
  live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
