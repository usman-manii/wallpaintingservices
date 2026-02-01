// frontend/lib/logger.ts
// Centralized logging service for frontend
// Only logs in development, can be extended with external services (Sentry, etc.)

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  log(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'log',
      message,
      timestamp: new Date(),
      context,
    };
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.log(`[LOG] ${message}`, context || '');
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date(),
      context,
    };
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date(),
      context,
    };
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date(),
      context,
      error,
    };
    this.addLog(entry);
    
    // Always log errors, even in production (but can be sent to external service)
    console.error(`[ERROR] ${message}`, error || '', context || '');
    
    // TODO: Send to error tracking service (Sentry, etc.) in production
    // if (!this.isDevelopment) {
    //   this.sendToErrorService(entry);
    // }
  }

  debug(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date(),
      context,
    };
    this.addLog(entry);
    
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(count = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Future: Send to external service
  private sendToErrorService(entry: LogEntry) {
    // Implement Sentry, LogRocket, or other error tracking service
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(entry.error || new Error(entry.message), {
    //     level: entry.level,
    //     extra: entry.context,
    //   });
    // }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogEntry, LogLevel };
