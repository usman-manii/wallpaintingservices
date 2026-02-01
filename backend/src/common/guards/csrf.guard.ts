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
    // For double-submit cookie the same value is sent in cookie and header
    return { token: secret, secret };
  }

  /**
   * Validate CSRF token
   */
  private validateToken(providedToken: string, cookieToken: string): boolean {
    // Double-submit cookie pattern: the same random token must appear in header and cookie
    if (!providedToken || !cookieToken) return false;
    if (providedToken.length !== cookieToken.length) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(providedToken, 'utf8'),
        Buffer.from(cookieToken, 'utf8'),
      );
    } catch {
      return false;
    }
  }
}
