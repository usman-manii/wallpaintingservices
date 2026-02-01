/**
 * Enterprise Logging Service for Frontend
 * Replaces console.log with structured, environment-aware logging
 * 
 * Features:
 * - Environment-based log levels
 * - Structured logging
 * - Error tracking integration ready
 * - Performance monitoring
 * - PII sanitization
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

class LoggerService {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private isClient: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isClient = typeof window !== 'undefined';
    this.logLevel = this.isDevelopment ? LogLevel.TRACE : LogLevel.WARN;
  }

  /**
   * Sanitize data to remove PII before logging
   */
  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) return data;

    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'ssn', 'creditCard'];

    for (const key in sanitized) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Format log entry with timestamp and context
   */
  private formatLog(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const componentInfo = context?.component ? `[${context.component}]` : '';
    
    return `[${timestamp}] ${level.toUpperCase()} ${componentInfo} ${message}`;
  }

  /**
   * Send logs to external service in production
   */
  private sendToExternalService(level: string, message: string, data?: any, context?: LogContext): void {
    if (!this.isDevelopment && this.isClient) {
      // Integration point for services like Sentry, LogRocket, DataDog, etc.
      // Example: Sentry.captureMessage(message, { level, extra: { data, context } });
      
      // For now, use beacon API for reliable log shipping
      const payload = {
        level,
        message,
        data: this.sanitize(data),
        context,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Beacon API ensures logs are sent even if page unloads
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/logs', blob);
      }
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.logLevel < LogLevel.ERROR) return;

    const formattedMessage = this.formatLog('ERROR', message, context);
    
    if (this.isDevelopment) {
      console.error(formattedMessage, error, context);
    }

    this.sendToExternalService('error', message, {
      error: error?.message || error,
      stack: error?.stack,
    }, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any, context?: LogContext): void {
    if (this.logLevel < LogLevel.WARN) return;

    const formattedMessage = this.formatLog('WARN', message, context);
    
    if (this.isDevelopment) {
      console.warn(formattedMessage, data, context);
    }

    this.sendToExternalService('warn', message, data, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: any, context?: LogContext): void {
    if (this.logLevel < LogLevel.INFO) return;

    const formattedMessage = this.formatLog('INFO', message, context);
    
    if (this.isDevelopment) {
      console.info(formattedMessage, data, context);
    }

    // Only send important info to external service
    if (context?.important) {
      this.sendToExternalService('info', message, data, context);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: any, context?: LogContext): void {
    if (this.logLevel < LogLevel.DEBUG) return;

    const formattedMessage = this.formatLog('DEBUG', message, context);
    
    if (this.isDevelopment) {
      console.debug(formattedMessage, data, context);
    }
  }

  /**
   * Log trace messages (verbose, development only)
   */
  trace(message: string, data?: any, context?: LogContext): void {
    if (this.logLevel < LogLevel.TRACE) return;

    const formattedMessage = this.formatLog('TRACE', message, context);
    
    if (this.isDevelopment) {
      console.log(formattedMessage, data, context);
    }
  }

  /**
   * Performance monitoring
   */
  performance(label: string, startTime: number, context?: LogContext): void {
    const duration = performance.now() - startTime;
    
    if (duration > 1000) { // Log slow operations (>1s)
      this.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`, { duration }, context);
    } else if (this.isDevelopment) {
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`, { duration }, context);
    }
  }

  /**
   * API call logging
   */
  api(method: string, endpoint: string, status: number, duration?: number, context?: LogContext): void {
    const message = `${method} ${endpoint} -> ${status}`;
    const data = { method, endpoint, status, duration };

    if (status >= 500) {
      this.error(message, data, context);
    } else if (status >= 400) {
      this.warn(message, data, context);
    } else if (this.isDevelopment) {
      this.debug(message, data, context);
    }
  }
}

// Singleton instance
export const logger = new LoggerService();

// Convenience exports
export default logger;
