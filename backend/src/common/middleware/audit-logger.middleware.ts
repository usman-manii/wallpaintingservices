import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Middleware for logging all API requests for audit and security purposes
 * Captures user actions, IP addresses, and request details
 */
@Injectable()
export class AuditLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditLoggerMiddleware.name);

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    
    // Extract user ID from request if authenticated
    const userId = (req as any).user?.id;

    // Log response after it's sent
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} - ${duration}ms - ${ip}`,
        );
      }

      // Log critical actions to database for audit trail (fire-and-forget for performance)
      if (this.shouldAudit(method, originalUrl, statusCode)) {
        // PERFORMANCE FIX: Don't await - log asynchronously to avoid blocking response
        this.logToDatabase({
          userId,
          method,
          url: originalUrl,
          statusCode,
          ip,
          userAgent,
          duration,
          timestamp: new Date(),
        }).catch((error) => {
          this.logger.error(`Failed to log audit entry: ${error.message}`);
        });
      }
    });

    next();
  }

  /**
   * Determine if request should be audited based on criteria
   */
  private shouldAudit(method: string, url: string, statusCode: number): boolean {
    // Audit all write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true;
    }

    // Audit failed authentications
    if (url.includes('/auth/') && statusCode === 401) {
      return true;
    }

    // Audit sensitive read operations
    if (url.includes('/users') || url.includes('/settings')) {
      return true;
    }

    return false;
  }

  /**
   * Store audit log in database
   */
  private async logToDatabase(data: {
    userId?: string;
    method: string;
    url: string;
    statusCode: number;
    ip: string;
    userAgent: string;
    duration: number;
    timestamp: Date;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          method: data.method,
          url: data.url,
          statusCode: data.statusCode,
          ip: data.ip,
          userAgent: data.userAgent,
          duration: data.duration,
          createdAt: data.timestamp,
        },
      });
    } catch (e) {
      this.logger.error('Failed to write audit log', e);
    }
  }
}
