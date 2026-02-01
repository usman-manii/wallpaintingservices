/**
 * Application Constants
 * Centralized configuration values to avoid magic numbers and strings
 * P4 Issue Fix: Replace hardcoded values with named constants
 */

// Rate Limiting
export const RATE_LIMIT = {
  AUTH_MAX_ATTEMPTS: 5,
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_MAX_REQUESTS: 100,
  API_WINDOW_MS: 60 * 1000, // 1 minute
} as const;

// Authentication
export const AUTH = {
  JWT_EXPIRATION: '7d',
  JWT_MIN_SECRET_LENGTH: 32,
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_SALT_ROUNDS: 12,
  RESET_TOKEN_EXPIRATION_HOURS: 24,
} as const;

// Cache Configuration
export const CACHE = {
  SETTINGS_TTL: 300, // 5 minutes
  BLOG_POST_TTL: 600, // 10 minutes
  STATIC_CONTENT_TTL: 3600, // 1 hour
  DEFAULT_TTL: 60, // 1 minute
} as const;

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// AI Configuration
export const AI = {
  MIN_WORD_COUNT: 3000,
  MAX_RETRY_ATTEMPTS: 3,
  GENERATION_TIMEOUT_MS: 60000, // 1 minute
} as const;

// Database
export const DATABASE = {
  POOL_MIN: 2,
  POOL_MAX: 10,
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API Timeouts
export const TIMEOUT = {
  API_REQUEST_MS: 30000, // 30 seconds
  DATABASE_QUERY_MS: 10000, // 10 seconds
  EXTERNAL_SERVICE_MS: 15000, // 15 seconds
} as const;

// Security
export const SECURITY = {
  CSRF_TOKEN_LENGTH: 32,
  SESSION_COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  PASSWORD_RESET_CODE_LENGTH: 8,
} as const;

// SEO
export const SEO = {
  META_DESCRIPTION_MAX_LENGTH: 160,
  META_TITLE_MAX_LENGTH: 60,
  SLUG_MAX_LENGTH: 100,
} as const;
