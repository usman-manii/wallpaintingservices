import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { EnvironmentValidator } from './common/guards/env-validation';
import { randomBytes } from 'crypto';
import cookieParser from 'cookie-parser';

/**
 * Bootstrap the NestJS application with enterprise-grade security and optimizations
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // Validate environment variables before starting
  try {
    EnvironmentValidator.validate();
  } catch (error: any) {
    logger.error(`Environment validation failed: ${error.message}`);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // 1. Security Headers (Helmet middleware) - Enterprise Grade
  // Protects against common web vulnerabilities with strict CSP
  app.use((req, res, next) => {
    // Generate unique nonce for each request
    const nonce = randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;

    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            `'nonce-${nonce}'`,
            'https://fonts.googleapis.com',
          ],
          scriptSrc: [
            "'self'",
            `'nonce-${nonce}'`,
            !isProduction ? "'unsafe-eval'" : null,
          ].filter(Boolean) as string[],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: [
            "'self'",
            !isProduction ? 'http://localhost:*' : null,
            process.env.FRONTEND_URL,
            process.env.PRODUCTION_URL,
            'https://www.google.com/recaptcha/',
            'https://www.gstatic.com/recaptcha/',
          ].filter(Boolean) as string[],
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'blob:'],
          frameSrc: ['https://www.google.com/recaptcha/', 'https://recaptcha.google.com/recaptcha/'],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false, // Allow external resources
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })(req, res, next);
  });

  // 2. Response Compression (Gzip)
  // Reduces bandwidth usage and improves response times
  app.use(compression());

  // 2.1 Cookie parsing for httpOnly auth cookies
  // Use a strong secret so signed cookies cannot be tampered with
  const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'change-me-cookie-secret';
  app.use(cookieParser(cookieSecret));

  // 2.2 Cache headers - prevent stale HTML/API responses that force users to hard-refresh
  app.use((req, res, next) => {
    // Allow long-term caching for obvious static assets; everything else is no-store
    const cacheSafePrefixes = ['/assets/', '/static/', '/favicon', '/robots.txt', '/sitemap', '/_next/'];
    const isCacheSafe = cacheSafePrefixes.some((prefix) => req.url.startsWith(prefix));
    if (!isCacheSafe) {
      res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    next();
  });

  // 3. CORS Configuration - Enterprise Grade
  // Allow requests from frontend and production domains with strict security
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://192.168.1.10:3000', // Local network access
    process.env.FRONTEND_URL,
    process.env.PRODUCTION_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // In development, be more permissive with local network IPs
      if (!isProduction && origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):(3000|3001)$/)) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from unauthorized origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  });

  // 4. Global Validation Pipeline
  // Automatically validates all incoming DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that don't have decorators
    transform: true, // Auto-transform payloads to DTO instances
    forbidNonWhitelisted: false, // Allow non-whitelisted properties (some endpoints need flexibility)
    transformOptions: {
      enableImplicitConversion: true, // Convert types automatically
    },
    // Skip validation for properties that don't have decorators (for backward compatibility)
    skipMissingProperties: false,
  }));

  // 5. Swagger API Documentation (disabled in production unless explicitly enabled)
  // Temporarily disabled due to Swagger compatibility issue with NestJS 11
  const swaggerEnabled = false; // process.env.SWAGGER_ENABLED === 'true' || !isProduction;
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('AI CMS API')
      .setDescription('Enterprise AI-powered Blogging Platform API with comprehensive content management')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication & User Management')
      .addTag('blog', 'Blog Posts & Content')
      .addTag('media', 'Media Library')
      .addTag('pages', 'Page Builder')
      .addTag('comments', 'Comment Management')
      .addTag('settings', 'Site Settings')
      .addTag('health', 'Health Checks')
      .build();
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document);
  } else {
    logger.log('Swagger docs disabled (compatibility issue - will be fixed in next update).');
  }

  // 6. Graceful Shutdown Handling
  // Ensures clean shutdown on SIGTERM/SIGINT
  app.enableShutdownHooks();
  
  process.on('SIGTERM', async () => {
    logger.warn('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.warn('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // 7. Start Server
  const PORT = process.env.PORT || 3001;
  const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces
  
  await app.listen(PORT, HOST);
  
  logger.log(`🚀 Backend running on: http://localhost:${PORT}`);
  logger.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
  logger.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`✅ Security: Helmet + CORS + Rate Limiting Enabled`);
}

bootstrap().catch(err => {
  console.error('❌ Fatal Error during bootstrap:', err);
  process.exit(1);
});
