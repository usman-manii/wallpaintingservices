/**
 * Monitoring and Metrics Service
 * Tracks application performance, errors, and custom metrics
 */

import { Injectable, Logger } from '@nestjs/common';

interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private metrics: Metric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: new Date(),
      tags,
    };

    this.metrics.push(metric);

    // Prevent memory leak - keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    this.logger.debug(`Metric recorded: ${name} = ${value}`);
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return this.metrics;
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    // Group by metric name
    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          avg: 0,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.sum += metric.value;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.avg = s.sum / s.count;
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.logger.log('All metrics cleared');
  }

  /**
   * Record API response time
   */
  recordResponseTime(endpoint: string, duration: number): void {
    this.recordMetric('api.response_time', duration, { endpoint });
  }

  /**
   * Record error
   */
  recordError(type: string, message: string): void {
    this.recordMetric('error.count', 1, { type, message: message.substring(0, 100) });
  }

  /**
   * Record database query time
   */
  recordDbQueryTime(query: string, duration: number): void {
    this.recordMetric('db.query_time', duration, { query: query.substring(0, 50) });
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    metricsCount: number;
  } {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metricsCount: this.metrics.length,
    };
  }
}
