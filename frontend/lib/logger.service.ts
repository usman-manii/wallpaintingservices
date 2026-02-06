/**
 * Enterprise Logging Service for Frontend
 * Replaces logger.debug with structured, environment-aware logging
 * 
 * Features:
 * - Environment-based log levels
 * - Structured logging
 * - Error tracking integration ready
 * - Performance monitoring
 * - PII sanitization
 */

import type { JsonValue } from '@/types/json';

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
  important?: boolean;
  [key: string]: JsonValue | undefined;
}

type LogData = JsonValue | Record<string, JsonValue>;

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: LogData;
  context?: LogContext;
};

class LoggerService {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private isClient: boolean;
  private recentLogs: LogEntry[] = [];
  private maxLogs = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isClient = typeof window !== 'undefined';
    this.logLevel = this.isDevelopment ? LogLevel.TRACE : LogLevel.WARN;
  }

  /**
   * Sanitize data to remove PII before logging
   */
  private sanitize(data: unknown): LogData | undefined {
    const sensitiveKeys = ['password', 'token', 'secret', 'apikey', 'ssn', 'creditcard'];
    const seen = new WeakSet<object>();

    const sanitizeValue = (value: unknown): JsonValue => {
      if (value === null) return null;
      const valueType = typeof value;
      if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
        return value as JsonValue;
      }
      if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
      }
      if (valueType === 'object') {
        if (seen.has(value as object)) {
          return '[Circular]';
        }
        seen.add(value as object);
        const result: Record<string, JsonValue> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
          const lowerKey = key.toLowerCase();
          if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeValue(val);
          }
        }
        return result;
      }
      return String(value);
    };

    if (data === undefined) return undefined;
    return sanitizeValue(data);
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
  private sendToExternalService(level: string, message: string, data?: unknown, context?: LogContext): void {
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
  error(message: string, error?: unknown, context?: LogContext): void {
    if (this.logLevel < LogLevel.ERROR) return;

    const formattedMessage = this.formatLog('ERROR', message, context);
    this.writeLocal({
      level: LogLevel.ERROR,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
      data: this.buildErrorData(error),
      context,
    });

    this.sendToExternalService('error', message, {
      error: this.normalizeErrorMessage(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: unknown, context?: LogContext): void {
    if (this.logLevel < LogLevel.WARN) return;

    const formattedMessage = this.formatLog('WARN', message, context);
    this.writeLocal({
      level: LogLevel.WARN,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
      data: this.sanitize(data),
      context,
    });

    this.sendToExternalService('warn', message, data, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: unknown, context?: LogContext): void {
    if (this.logLevel < LogLevel.INFO) return;

    const formattedMessage = this.formatLog('INFO', message, context);
    this.writeLocal({
      level: LogLevel.INFO,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
      data: this.sanitize(data),
      context,
    });

    // Only send important info to external service
    if (context?.important) {
      this.sendToExternalService('info', message, data, context);
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: unknown, context?: LogContext): void {
    if (this.logLevel < LogLevel.DEBUG) return;

    const formattedMessage = this.formatLog('DEBUG', message, context);
    this.writeLocal({
      level: LogLevel.DEBUG,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
      data: this.sanitize(data),
      context,
    });
  }

  /**
   * Log trace messages (verbose, development only)
   */
  trace(message: string, data?: unknown, context?: LogContext): void {
    if (this.logLevel < LogLevel.TRACE) return;

    const formattedMessage = this.formatLog('TRACE', message, context);
    this.writeLocal({
      level: LogLevel.TRACE,
      message: formattedMessage,
      timestamp: new Date().toISOString(),
      data: this.sanitize(data),
      context,
    });
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

  getRecentLogs(count = 50): LogEntry[] {
    return this.recentLogs.slice(-count);
  }

  clearLogs(): void {
    this.recentLogs = [];
  }

  private normalizeErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  private buildErrorData(error: unknown): LogData | undefined {
    if (!error) return undefined;
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack || '',
      };
    }
    return this.sanitize(error);
  }

  private writeLocal(entry: LogEntry): void {
    if (!this.isDevelopment) return;
    this.recentLogs.push(entry);
    if (this.recentLogs.length > this.maxLogs) {
      this.recentLogs.shift();
    }

    if (!this.isClient && typeof process !== 'undefined' && process.stdout?.write) {
      const line = `${entry.message}${entry.data ? ` ${JSON.stringify(entry.data)}` : ''}\n`;
      if (entry.level === LogLevel.ERROR) {
        process.stderr.write(line);
      } else {
        process.stdout.write(line);
      }
    }
  }
}

// Singleton instance
export const logger = new LoggerService();

// Convenience exports
export default logger;

