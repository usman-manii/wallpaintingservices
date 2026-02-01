import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter for API endpoints
 * Prevents brute force attacks and API abuse
 * 
 * For production, consider using Redis-based solution like @nestjs/throttler
 */
@Injectable()
export class RateLimiter implements NestMiddleware {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  
  // Configuration (can be moved to env vars)
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly maxRequests = 100; // requests per window
  private readonly authMaxRequests = 5; // stricter for auth endpoints
  
  use(req: Request, res: Response, next: NextFunction) {
    const identifier = this.getIdentifier(req);
    const isAuthEndpoint = req.path.startsWith('/auth/login') || 
                          req.path.startsWith('/auth/register') ||
                          req.path.startsWith('/auth/forgot-password');
    
    const limit = isAuthEndpoint ? this.authMaxRequests : this.maxRequests;
    const now = Date.now();
    
    // Get or create entry
    let entry = this.requests.get(identifier);
    
    // Reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }
    
    // Increment request count
    entry.count++;
    this.requests.set(identifier, entry);
    
    // Check if limit exceeded
    if (entry.count > limit) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', (limit - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
    
    // Cleanup old entries periodically (every 100 requests)
    if (this.requests.size > 10000) {
      this.cleanup(now);
    }
    
    next();
  }
  
  /**
   * Get unique identifier for rate limiting (IP + User Agent)
   */
  private getIdentifier(req: Request): string {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}:${userAgent}`;
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(now: number) {
    for (const [key, value] of this.requests.entries()) {
      if (now > value.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}
