import { Injectable, NestMiddleware, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * CSRF Protection Middleware
 * Validates CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
 * Token is set in cookie by auth controller and must match header value
 */
@Injectable()
export class CsrfProtection implements NestMiddleware {
  private readonly logger = new Logger(CsrfProtection.name);
  
  // Methods that require CSRF protection
  private readonly protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  // Paths exempt from CSRF protection
  private readonly exemptPaths = [
    '/auth/login',        // Initial login doesn't have token yet
    '/auth/register',     // Initial registration doesn't have token yet
    '/auth/refresh',      // Token refresh uses httpOnly cookie
    '/auth/logout',       // Logout is safe even without CSRF
    '/health',            // Health check
    '/api/auth/logout',   // Frontend logout endpoint
  ];
  
  use(req: Request, _res: Response, next: NextFunction) {
    // Skip if method doesn't need CSRF protection
    if (!this.protectedMethods.includes(req.method)) {
      return next();
    }
    
    const requestPath = (req.originalUrl || req.path || '').split('?')[0];
    const normalizedPath = requestPath.length > 1 ? requestPath.replace(/\/+$/, '') : requestPath;
    const altPath = req.path ? (req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path) : normalizedPath;

    // Skip if path is exempt
    if (this.exemptPaths.some((path) => (
      normalizedPath === path ||
      normalizedPath.startsWith(path) ||
      altPath === path ||
      altPath.startsWith(path)
    ))) {
      return next();
    }
    
    // Get token from cookie and header
    const tokenFromCookie = req.cookies?.['csrf-token'];
    const tokenFromHeader = req.headers['x-csrf-token'] || req.headers['X-CSRF-Token'];
    
    // Both must exist and match
    if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
      this.logger.warn(`CSRF validation failed for ${req.method} ${requestPath} from IP: ${req.ip}`);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'CSRF token validation failed. Please refresh and try again.',
          error: 'Forbidden',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    
    // CSRF token is valid
    next();
  }
}
