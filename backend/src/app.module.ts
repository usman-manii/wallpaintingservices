import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { SettingsModule } from './settings/settings.module';
import { ContactModule } from './contact/contact.module';
import { CommentModule } from './comment/comment.module';
import { PageBuilderModule } from './page-builder/page-builder.module';
import { TasksModule } from './tasks/tasks.module';
import { SitemapModule } from './sitemap/sitemap.module';
import { MediaModule } from './media/media.module';
import { SocialModule } from './social/social.module';
import { MailModule } from './mail/mail.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { CaptchaModule } from './captcha/captcha.module';
import { HealthModule } from './health/health.module';
import { AuditLoggerMiddleware } from './common/middleware/audit-logger.middleware';
import { CsrfProtection } from './common/middleware/csrf-protection.middleware';
import { CategoryModule } from './category/category.module';
import { FeedbackModule } from './feedback/feedback.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';

/**
 * Main application module
 * Configures core features: rate limiting, security, health checks, and audit logging
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Rate limiting: 100 requests per minute per IP address
    // Use seconds-based TTL per NestJS ThrottlerModule expectations
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // Time window in seconds (1 minute)
          limit: 100, // Maximum requests per window
        },
      ],
    }),
    HealthModule,
    PrismaModule,
    MailModule,
    QueueModule,
    AiModule,
    AuthModule,
    BlogModule,
    SettingsModule,
    ContactModule,
    CommentModule,
    PageBuilderModule,
    TasksModule,
    SitemapModule,
    MediaModule,
    SocialModule,
    CaptchaModule,
    CategoryModule,
    FeedbackModule,
    NotificationsModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [
    // Apply rate limiting globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Protect all routes globally by default
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware for the application
   * Applies CSRF protection and audit logging to all routes
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF protection to all routes (with internal exemptions)
    consumer.apply(CsrfProtection).forRoutes('*');
    
    // Apply audit logging to all routes
    consumer.apply(AuditLoggerMiddleware).forRoutes('*');
  }
}
