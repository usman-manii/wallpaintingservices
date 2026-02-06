/**
 * Global TypeScript type definitions for the backend
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // Application
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    HOST?: string;
    FRONTEND_URL: string;
    PRODUCTION_URL?: string;

    // Database
    DATABASE_URL: string;
    DATABASE_POOL_MIN?: string;
    DATABASE_POOL_MAX?: string;

    // Security
    JWT_SECRET: string;
    JWT_EXPIRATION?: string;
    JWT_ACCESS_EXPIRES?: string;
    JWT_REFRESH_EXPIRES?: string;
    JWT_REFRESH_SECRET?: string;
    JWT_ACCESS_MAXAGE_MS?: string;
    JWT_REFRESH_MAXAGE_MS?: string;
    APP_SECRET: string;
    COOKIE_SECRET: string;
    COOKIE_SECURE?: string;
    COOKIE_SAMESITE?: string;
    COOKIE_DOMAIN?: string;
    TRUST_PROXY?: string;

    // AI/LLM
    AI_API_KEY: string;
    AI_PROVIDER?: 'openai' | 'anthropic' | 'cohere';
    AI_MODEL?: string;
    ANTHROPIC_API_KEY?: string;
    COHERE_API_KEY?: string;

    // CAPTCHA
    RECAPTCHA_V2_SITE_KEY?: string;
    RECAPTCHA_V2_SECRET_KEY?: string;
    RECAPTCHA_V3_SITE_KEY?: string;
    RECAPTCHA_V3_SECRET_KEY?: string;

    // Email/SMTP
    MAIL_HOST?: string;
    MAIL_PORT?: string;
    MAIL_USER?: string;
    MAIL_PASS?: string;
    MAIL_FROM?: string;
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_SECURE?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
    EMAIL_FROM?: string;

    // Redis
    REDIS_HOST?: string;
    REDIS_PORT?: string;
    REDIS_PASSWORD?: string;
    REDIS_DB?: string;

    // File Storage
    UPLOAD_DIR?: string;
    MAX_FILE_SIZE_MB?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_REGION?: string;
    AWS_S3_BUCKET?: string;
    CDN_URL?: string;

    // SEO & Analytics
    GOOGLE_ANALYTICS_ID?: string;
    GOOGLE_TAG_MANAGER_ID?: string;
    GOOGLE_SITE_VERIFICATION?: string;
    BING_VERIFICATION?: string;
    YANDEX_VERIFICATION?: string;

    // Features
    ENABLE_SWAGGER?: string;
    SWAGGER_ENABLED?: string;
    ENABLE_RATE_LIMITING?: string;
    RATE_LIMIT_MAX?: string;
    RATE_LIMIT_TTL?: string;

    // Monitoring
    SENTRY_DSN?: string;
    LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';

    // Development
    DEBUG?: string;
  }
}

/**
 * Extended Express Request with user context
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        capabilities?: string[];
      };
      requestId?: string;
    }
  }
}

export {};
