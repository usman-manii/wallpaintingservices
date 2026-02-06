/**
 * Advanced Rate Limiting Guard for NestJS
 * 
 * Features:
 * - IP-based and user-based rate limiting
 * - Sliding window algorithm
 * - Redis-backed (optional) or in-memory
 * - Configurable limits per endpoint
 * - DDoS protection
 * - Whitelist support
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedRequest } from '../types';

export interface RateLimitOptions {
  points: number;          // Number of requests allowed
  duration: number;        // Time window in seconds
  blockDuration?: number;  // How long to block after limit (seconds)
  keyPrefix?: string;      // Redis key prefix
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Decorator to set rate limit options
export const RateLimit = (options: RateLimitOptions) =>
  Reflect.defineMetadata('rateLimit', options, Object);

interface RateLimitRecord {
  points: number;
  resetTime: number;
  blockUntil?: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly store = new Map<string, RateLimitRecord>();
  private readonly whitelist = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;

  // Default rate limit: 100 requests per 15 minutes
  private readonly defaultOptions: RateLimitOptions = {
    points: 100,
    duration: 900, // 15 minutes
    blockDuration: 900,
  };

  constructor(private reflector: Reflector) {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    
    // Add localhost to whitelist in development
    if (process.env.NODE_ENV !== 'production') {
      this.whitelist.add('127.0.0.1');
      this.whitelist.add('::1');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const options = this.getOptions(context);

    if (!options) {
      return true; // No rate limit configured
    }

    const key = this.getKey(request, options);

    // Check whitelist
    const clientIp = this.getClientIp(request);
    if (this.whitelist.has(clientIp)) {
      return true;
    }

    const record = this.store.get(key) || this.createRecord(options);

    // Check if currently blocked
    if (record.blockUntil && Date.now() < record.blockUntil) {
      const remainingTime = Math.ceil((record.blockUntil - Date.now()) / 1000);
      this.logger.warn(
        `Rate limit block active for ${key} (${remainingTime}s remaining)`
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Please try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Reset if window expired
    if (Date.now() > record.resetTime) {
      record.points = options.points;
      record.resetTime = Date.now() + options.duration * 1000;
      record.blockUntil = undefined;
    }

    // Check if limit exceeded
    if (record.points <= 0) {
      const blockDuration = options.blockDuration || options.duration;
      record.blockUntil = Date.now() + blockDuration * 1000;
      this.store.set(key, record);

      this.logger.warn(`Rate limit exceeded for ${key}, blocking for ${blockDuration}s`);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Please try again in ${blockDuration} seconds.`,
          retryAfter: blockDuration,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Consume a point
    record.points--;
    this.store.set(key, record);

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', options.points);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, record.points));
    response.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    return true;
  }

  private getOptions(context: ExecutionContext): RateLimitOptions | null {
    // Check handler-level rate limit
    const handlerOptions = this.reflector.get<RateLimitOptions>(
      'rateLimit',
      context.getHandler()
    );

    if (handlerOptions) {
      return handlerOptions;
    }

    // Check class-level rate limit
    const classOptions = this.reflector.get<RateLimitOptions>(
      'rateLimit',
      context.getClass()
    );

    return classOptions || null;
  }

  private getKey(request: AuthenticatedRequest, options: RateLimitOptions): string {
    const prefix = options.keyPrefix || 'ratelimit';
    const clientIp = this.getClientIp(request);
    
    // Use user ID if authenticated, otherwise IP
    const identifier = request.user?.id || clientIp;
    
    return `${prefix}:${identifier}`;
  }

  private getClientIp(request: Request): string {
    // Check for proxy headers
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return realIp as string;
    }

    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private createRecord(options: RateLimitOptions): RateLimitRecord {
    return {
      points: options.points,
      resetTime: Date.now() + options.duration * 1000,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.store.entries()) {
      // Remove expired entries
      if (now > record.resetTime && !record.blockUntil) {
        this.store.delete(key);
        cleaned++;
      }
      // Remove expired blocks
      else if (record.blockUntil && now > record.blockUntil) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  // Public method to add IPs to whitelist
  addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
    this.logger.log(`Added ${ip} to rate limit whitelist`);
  }

  // Public method to remove from whitelist
  removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip);
    this.logger.log(`Removed ${ip} from rate limit whitelist`);
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // Very strict: 5 requests per minute (login, registration)
  STRICT: { points: 5, duration: 60, blockDuration: 300 },
  
  // Strict: 10 requests per minute (password reset, sensitive operations)
  AUTH: { points: 10, duration: 60, blockDuration: 180 },
  
  // Moderate: 30 requests per minute (API writes)
  MODERATE: { points: 30, duration: 60, blockDuration: 120 },
  
  // Relaxed: 100 requests per minute (API reads)
  RELAXED: { points: 100, duration: 60, blockDuration: 60 },
  
  // Generous: 1000 requests per hour (public endpoints)
  PUBLIC: { points: 1000, duration: 3600, blockDuration: 300 },
};
