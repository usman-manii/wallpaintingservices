/**
 * Enhanced Logging Service
 * Provides structured logging with context
 */

import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: any;
  error?: Error;
}

@Injectable({ scope: Scope.TRANSIENT })
export class EnhancedLoggerService implements NestLoggerService {
  private context?: string;
  private logDir = 'logs';
  private readonly isProduction = process.env.NODE_ENV === 'production';

  constructor(context?: string) {
    this.context = context;
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    const { level, message, context, timestamp, data, error } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${context ? `[${context}] ` : ''}${message}`;

    if (data) {
      formatted += ` ${JSON.stringify(data)}`;
    }

    if (error) {
      formatted += `\n${error.stack}`;
    }

    return formatted;
  }

  /**
   * Write log to file
   */
  private writeToFile(level: LogLevel, entry: string): void {
    if (!this.isProduction) return; // Only write to files in production

    const filename = join(this.logDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
    try {
      appendFileSync(filename, entry + '\n');
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  /**
   * Core logging method
   */
  private logEntry(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      timestamp: new Date().toISOString(),
      data,
      error,
    };

    const formatted = this.formatLogEntry(entry);

    // Console output
    const coloredOutput = this.colorize(level, formatted);
    console.log(coloredOutput);

    // File output (production only)
    if (this.isProduction) {
      this.writeToFile(level, formatted);
    }
  }

  /**
   * Add color to console output
   */
  private colorize(level: LogLevel, message: string): string {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.INFO]: '\x1b[36m', // Cyan
      [LogLevel.DEBUG]: '\x1b[35m', // Magenta
      [LogLevel.VERBOSE]: '\x1b[37m', // White
    };

    const reset = '\x1b[0m';
    return `${colors[level] || ''}${message}${reset}`;
  }

  // NestJS LoggerService interface methods
  log(message: any, context?: string): void {
    this.logEntry(LogLevel.INFO, message, undefined, undefined);
  }

  error(message: any, trace?: string, context?: string): void {
    const error = trace ? new Error(trace) : undefined;
    this.logEntry(LogLevel.ERROR, message, undefined, error);
  }

  warn(message: any, context?: string): void {
    this.logEntry(LogLevel.WARN, message);
  }

  debug(message: any, context?: string): void {
    this.logEntry(LogLevel.DEBUG, message);
  }

  verbose(message: any, context?: string): void {
    this.logEntry(LogLevel.VERBOSE, message);
  }

  // Custom methods with additional data
  logWithData(level: LogLevel, message: string, data: any): void {
    this.logEntry(level, message, data);
  }

  errorWithStack(message: string, error: Error): void {
    this.logEntry(LogLevel.ERROR, message, undefined, error);
  }

  /**
   * Set context for this logger instance
   */
  setContext(context: string): void {
    this.context = context;
  }
}
