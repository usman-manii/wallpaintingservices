import { Logger } from '@nestjs/common';

/**
 * Validates required environment variables on application startup
 * Prevents application from starting with missing critical configuration
 */
export class EnvironmentValidator {
  private static readonly logger = new Logger(EnvironmentValidator.name);

  /**
   * List of required environment variables for production
   */
  private static readonly REQUIRED_VARS = [
    'DATABASE_URL',
    'JWT_SECRET',
    'APP_SECRET',
    'PORT',
    'NODE_ENV',
  ];

  /**
   * Optional but recommended environment variables
   */
  private static readonly RECOMMENDED_VARS = [
    'AI_API_KEY',
    'FRONTEND_URL',
    'RECAPTCHA_V2_SECRET_KEY',
    'RECAPTCHA_V3_SECRET_KEY',
  ];

  /**
   * Validate all environment variables
   * Throws error if critical vars are missing in production
   */
  static validate(): void {
    this.logger.log('Validating environment variables...');

    const missingRequired = this.REQUIRED_VARS.filter(
      (varName) => !process.env[varName],
    );

    const missingRecommended = this.RECOMMENDED_VARS.filter(
      (varName) => !process.env[varName],
    );

    // Check required variables
    if (missingRequired.length > 0) {
      const errorMsg = `Missing required environment variables: ${missingRequired.join(', ')}`;
      
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      } else {
        this.logger.warn(
          `${errorMsg} (Development mode - continuing with defaults)`,
        );
      }
    }

    // Check recommended variables
    if (missingRecommended.length > 0) {
      this.logger.warn(
        `Missing recommended environment variables: ${missingRecommended.join(', ')}`,
      );
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      this.logger.error(
        'JWT_SECRET is too short. Use at least 32 characters for security.',
      );
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
      }
    }

    // Validate APP_SECRET strength
    if (process.env.APP_SECRET && process.env.APP_SECRET.length < 32) {
      this.logger.error(
        'APP_SECRET is too short. Use at least 32 characters for security.',
      );
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('APP_SECRET must be at least 32 characters in production');
      }
    }

    this.logger.log('✅ Environment validation passed');
  }

  /**
   * Get environment info for health check
   */
  static getInfo(): Record<string, any> {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasAppSecret: !!process.env.APP_SECRET,
      hasAiKey: !!process.env.AI_API_KEY,
      hasRecaptcha: !!(
        process.env.RECAPTCHA_V2_SECRET_KEY || process.env.RECAPTCHA_V3_SECRET_KEY
      ),
    };
  }
}
