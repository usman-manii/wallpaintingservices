// frontend/lib/constants.ts
// Centralized constants for the frontend application

export const THEME = {
  LIGHT: 'light' as const,
  DARK: 'dark' as const,
  SYSTEM: 'system' as const,
} as const;

export type ThemeMode = typeof THEME[keyof typeof THEME];

export const CAPTCHA_TYPE = {
  RECAPTCHA_V2: 'recaptcha-v2' as const,
  RECAPTCHA_V3: 'recaptcha-v3' as const,
  CUSTOM: 'custom' as const,
} as const;

export type CaptchaType = typeof CAPTCHA_TYPE[keyof typeof CAPTCHA_TYPE];

export const USER_ROLES = {
  SUBSCRIBER: 'SUBSCRIBER' as const,
  CONTRIBUTOR: 'CONTRIBUTOR' as const,
  AUTHOR: 'AUTHOR' as const,
  EDITOR: 'EDITOR' as const,
  ADMINISTRATOR: 'ADMINISTRATOR' as const,
  SUPER_ADMIN: 'SUPER_ADMIN' as const,
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const POST_STATUS = {
  DRAFT: 'DRAFT' as const,
  AI_QUEUE: 'AI_QUEUE' as const,
  AI_GENERATING: 'AI_GENERATING' as const,
  AI_REVIEW: 'AI_REVIEW' as const,
  APPROVED_DRAFT: 'APPROVED_DRAFT' as const,
  SCHEDULED: 'SCHEDULED' as const,
  PUBLISHED: 'PUBLISHED' as const,
  ARCHIVED: 'ARCHIVED' as const,
  REFRESH_QUEUE: 'REFRESH_QUEUE' as const,
} as const;

export type PostStatus = typeof POST_STATUS[keyof typeof POST_STATUS];

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  BLOG: {
    BASE: '/blog',
    BY_SLUG: (slug: string) => `/blog/${slug}`,
    CATEGORIES: '/blog/categories',
    TAGS: '/blog/tags',
    RSS: '/blog/rss',
  },
  SETTINGS: {
    PUBLIC: '/settings/public',
    ADMIN: '/settings',
  },
  PAGES: {
    BASE: '/pages',
    PUBLIC: '/pages/public',
    BY_SLUG: (slug: string) => `/pages/slug/${slug}`,
    BY_ID: (id: string) => `/pages/id/${id}`,
  },
  COMMENTS: {
    BASE: '/comments',
    BY_POST: (postId: string) => `/comments/post/${postId}`,
    MODERATION: {
      PENDING: '/comments/moderation/pending',
      SPAM: '/comments/moderation/spam',
      FLAGGED: '/comments/moderation/flagged',
      STATS: '/comments/moderation/stats',
    },
  },
  MEDIA: {
    BASE: '/media',
    UPLOAD: '/media/upload',
  },
  CONTACT: '/contact',
  CAPTCHA: {
    CHALLENGE: '/captcha/challenge',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  FILE_UPLOAD: 60000, // 60 seconds
  IMAGE_LOAD: 10000, // 10 seconds
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
} as const;

export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME: 'theme',
} as const;

// Animation durations (in ms)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// SEO defaults
export const SEO = {
  DEFAULT_TITLE_SUFFIX: ' | Wall Painting Services',
  MAX_TITLE_LENGTH: 60,
  MAX_DESCRIPTION_LENGTH: 160,
  DEFAULT_OG_IMAGE_WIDTH: 1200,
  DEFAULT_OG_IMAGE_HEIGHT: 630,
} as const;
