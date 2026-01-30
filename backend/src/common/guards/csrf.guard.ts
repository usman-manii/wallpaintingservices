import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Guard
 * Protects against Cross-Site Request Forgery attacks
 * Validates CSRF tokens on state-changing operations (POST, PUT, PATCH, DELETE)
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);
  private readonly tokenSecret = process.env.APP_SECRET || 'fallback-secret-key-change-in-production';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Skip CSRF check for API requests with Bearer tokens (already authenticated)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return true;
    }

    // Validate CSRF token
    const csrfToken = request.headers['x-csrf-token'] as string;
    const cookieToken = request.cookies?.['csrf-token'];

    if (!csrfToken || !cookieToken) {
      this.logger.warn(`CSRF validation failed: Missing token for ${method} ${request.url}`);
      throw new ForbiddenException('CSRF token missing');
    }

    if (!this.validateToken(csrfToken, cookieToken)) {
      this.logger.warn(`CSRF validation failed: Invalid token for ${method} ${request.url}`);
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }

  /**
   * Generate a CSRF token pair
   */
  generateTokenPair(): { token: string; secret: string } {
    const secret = crypto.randomBytes(32).toString('hex');
    const token = this.hashToken(secret);
    
    return { token, secret };
  }

  /**
   * Validate CSRF token
   */
  private validateToken(providedToken: string, secret: string): boolean {
    const expectedToken = this.hashToken(secret);
    return crypto.timingSafeEqual(
      Buffer.from(providedToken, 'utf8'),
      Buffer.from(expectedToken, 'utf8')
    );
  }

  /**
   * Hash token with secret
   */
  private hashToken(secret: string): string {
    return crypto
      .createHmac('sha256', this.tokenSecret)
      .update(secret)
      .digest('hex');
  }
}
