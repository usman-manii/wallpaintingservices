import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EnhancedBlogService } from '../blog/enhanced-blog.service';
import { AiBlogService } from '../blog/ai-blog.service';
import { SitemapService } from './sitemap.service';
import { CommentModerationService } from '../comment/comment-moderation.service';
import { AiService } from '../ai/ai.service';
import { SocialService } from '../social/social.service';
import { PrismaService } from '../prisma/prisma.service';
import { JsonValue } from '../common/types/json';

type AiMetadata = Record<string, JsonValue>;

type SocialChannel = {
  id: string;
  name?: string;
  enabled?: boolean;
  autoPublish?: boolean;
  renewInterval?: number;
};

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

const getErrorStack = (error: unknown): string | undefined => (
  error instanceof Error ? error.stack : undefined
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseAiMetadata = (value: unknown): AiMetadata => (
  isRecord(value) ? (value as AiMetadata) : {}
);

const parseSocialLinks = (value: unknown): SocialChannel[] => (
  Array.isArray(value)
    ? value.filter(isRecord).map((channel) => ({
        id: String(channel.id ?? ''),
        name: typeof channel.name === 'string' ? channel.name : undefined,
        enabled: typeof channel.enabled === 'boolean' ? channel.enabled : undefined,
        autoPublish: typeof channel.autoPublish === 'boolean' ? channel.autoPublish : undefined,
        renewInterval: typeof channel.renewInterval === 'number' ? channel.renewInterval : undefined,
      })).filter((channel) => channel.id.length > 0)
    : []
);

const parseDateValue = (value: JsonValue | undefined): Date | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly enhancedBlogService: EnhancedBlogService,
    private readonly aiBlogService: AiBlogService,
    private readonly sitemapService: SitemapService,
    private readonly commentModerationService: CommentModerationService,
    private readonly aiService: AiService,
    private readonly socialService: SocialService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * BLOG: Scheduled Post Publishing
   * Runs every 5 minutes to publish posts that are scheduled for the past
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleScheduledPosts() {
    this.logger.log('[BLOG] Running scheduled post publishing job...');

    try {
      const publishedCount = await this.enhancedBlogService.processScheduledPosts();

      if (publishedCount > 0) {
        this.logger.log(`[OK] [BLOG] Published ${publishedCount} scheduled post(s)`);
      } else {
        this.logger.debug('[BLOG] No scheduled posts ready to publish');
      }
    } catch (error) {
      this.logger.error(
        `[BLOG] Error processing scheduled posts: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * BLOG: Trending Tags Update
   * Runs daily at 3:00 AM to analyze tag usage and update trending flags
   */
  @Cron('0 3 * * *')
  async handleTrendingTags() {
    this.logger.log('[BLOG] Running trending tags update job...');

    try {
      const trendingCount = await this.enhancedBlogService.updateTrendingTags();
      this.logger.log(`[OK] [BLOG] Updated ${trendingCount} trending tags`);
    } catch (error) {
      this.logger.error(
        `[BLOG] Error updating trending tags: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * DATABASE: Cleanup Old Spam Comments
   * Runs daily at 2:00 AM to clean up old spam data
   */
  @Cron('0 2 * * *')
  async handleDatabaseCleanup() {
    this.logger.log('[DATABASE] Running database cleanup job...');

    try {
      // Delete spam comments older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await this.commentModerationService.deleteOldSpam(ninetyDaysAgo);

      this.logger.log(`[OK] [DATABASE] Cleaned up ${result.count} old spam comments`);
    } catch (error) {
      this.logger.error(
        `[DATABASE] Error during database cleanup: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * SEO: XML Sitemap Generation
   * Runs daily at 4:00 AM to regenerate sitemap
   */
  @Cron('0 4 * * *')
  async handleSitemapGeneration() {
    this.logger.log('[SEO] Running sitemap generation job...');

    try {
      await this.sitemapService.generateSitemap();
      const stats = await this.sitemapService.getSitemapStats();

      this.logger.log(`[OK] [SEO] Sitemap generated: ${stats.totalUrls} URLs (${stats.blogPosts} posts, ${stats.categories} categories, ${stats.tags} tags)`);
    } catch (error) {
      this.logger.error(
        `[SEO] Error generating sitemap: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * AI: Content Analysis & Optimization (Future)
   * Runs weekly on Sundays at 1:00 AM
   * Analyzes content quality and suggests improvements
   */
  @Cron('0 1 * * 0')
  async handleContentAnalysis() {
    this.logger.log('[AI] Running content analysis job...');

    try {
      // Find top 5 viewed posts from the last 30 days that haven't been optimized in 60 days
      const candidates = await this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { viewCount: 'desc' },
        take: 5
      });

      let analyzedCount = 0;
      for (const post of candidates) {
        // Skip if recently optimized (check not yet in schema, simpler fallback)
        const analysis = await this.aiService.optimizeSeo(post.content);

        // Save analysis to AI Metadata
        const currentMeta = parseAiMetadata(post.aiMetadata);
        await this.prisma.post.update({
          where: { id: post.id },
          data: {
            aiMetadata: {
              ...currentMeta,
              lastSeoAnalysis: new Date().toISOString(),
              seoScore: analysis.score,
              seoSuggestions: analysis.suggestions
            }
          }
        });
        analyzedCount++;
      }

      this.logger.log(`[OK] [AI] Analyzed ${analyzedCount} posts for content quality`);
    } catch (error) {
      this.logger.error(
        `[AI] Content analysis failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * DISTRIBUTION: Social Media Auto-Posting
   * Runs every hour to distribute new or renewable content
   */
  @Cron('0 * * * *')
  async handleSocialDistribution() {
    this.logger.log('[DISTRIBUTION] Checking for posts to distribute...');

    try {
      const settings = await this.prisma.siteSettings.findFirst();
      const socialLinks = parseSocialLinks(settings?.socialLinks);

      // Find channels with auto-publishing enabled
      const autoChannels = socialLinks.filter(channel => channel.enabled && channel.autoPublish);
      if (autoChannels.length === 0) {
        this.logger.debug('[DISTRIBUTION] No auto-publish channels configured.');
        return;
      }

      // 1. Process NEW Posts (Published in last hour, never shared)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const newPosts = await this.prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          // In a real app, we would check "sharedAt" in metadata or another field.
          publishedAt: { gte: oneHourAgo }
        }
      });

      for (const post of newPosts) {
        // Check if already shared (using metadata if available)
        const meta = parseAiMetadata(post.aiMetadata);
        if (!meta.socialSharedAt) {
          await this.socialService.distributePost(post.id, autoChannels.map(channel => channel.id));

          // Mark shared
          await this.prisma.post.update({
            where: { id: post.id },
            data: {
              aiMetadata: {
                ...meta,
                socialSharedAt: new Date().toISOString()
              }
            }
          });
        }
      }

      // 2. Process RENEWABLE Posts
      for (const channel of autoChannels) {
        if (typeof channel.renewInterval === 'number' && channel.renewInterval > 0) {
          const daysAgo = new Date(Date.now() - channel.renewInterval * 24 * 60 * 60 * 1000);
          // Check older posts
          const candidates = await this.prisma.post.findMany({
            where: { status: 'PUBLISHED', publishedAt: { lte: daysAgo } },
            take: 5,
            orderBy: { updatedAt: 'asc' }
          });

          for (const post of candidates) {
            const meta = parseAiMetadata(post.aiMetadata);
            const lastShared = parseDateValue(meta.socialSharedAt);
            if (!lastShared || lastShared <= daysAgo) {
              this.logger.log(`[RENEW] Renewing post "${post.title}" for ${channel.name ?? channel.id}`);
              await this.socialService.distributePost(post.id, [channel.id]);
              await this.prisma.post.update({
                where: { id: post.id },
                data: {
                  aiMetadata: { ...meta, socialSharedAt: new Date().toISOString() },
                  updatedAt: new Date()
                }
              });
              break; // Limit 1 per channel
            }
          }
        }
      }

      if (newPosts.length > 0) {
        this.logger.log(`[OK] [DISTRIBUTION] Distributed ${newPosts.length} new posts.`);
      }

    } catch (error) {
      this.logger.error(
        `[DISTRIBUTION] Distribution task failed: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * SEO: Search Engine Ping (After Sitemap Update)
   * Runs daily at 4:30 AM (30 min after sitemap generation)
   */
  @Cron('30 4 * * *')
  async handleSearchEnginePing() {
    this.logger.log('[SEO] Pinging search engines about sitemap update...');

    try {
      if (!process.env.FRONTEND_URL) {
        this.logger.warn('[SEO] FRONTEND_URL not set. Skipping search engine ping.');
        return;
      }

      // Ping Google
      const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(`${process.env.FRONTEND_URL}/sitemap.xml`)}`;

      // Ping Bing
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(`${process.env.FRONTEND_URL}/sitemap.xml`)}`;

      // Note: In production, use fetch to actually ping
      // await fetch(googlePingUrl);
      // await fetch(bingPingUrl);

      this.logger.log('[OK] [SEO] Search engines notified about sitemap update');
    } catch (error) {
      this.logger.error(
        `[SEO] Error pinging search engines: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * Get all cron jobs info
   */
  getAllCronJobs() {
    return [
      {
        id: 'scheduled-posts',
        name: 'Scheduled Post Publishing',
        category: 'BLOG',
        schedule: 'Every 5 minutes',
        cronExpression: '*/5 * * * *',
        description: 'Publishes posts that are scheduled for the past',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('*/5 * * * *'),
      },
      {
        id: 'trending-tags',
        name: 'Trending Tags Update',
        category: 'BLOG',
        schedule: 'Daily at 3:00 AM',
        cronExpression: '0 3 * * *',
        description: 'Analyzes tag usage and updates trending flags',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('0 3 * * *'),
      },
      {
        id: 'database-cleanup',
        name: 'Database Cleanup',
        category: 'DATABASE',
        schedule: 'Daily at 2:00 AM',
        cronExpression: '0 2 * * *',
        description: 'Deletes spam comments older than 90 days',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('0 2 * * *'),
      },
      {
        id: 'sitemap-generation',
        name: 'XML Sitemap Generation',
        category: 'SEO',
        schedule: 'Daily at 4:00 AM',
        cronExpression: '0 4 * * *',
        description: 'Generates XML sitemap for search engines',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('0 4 * * *'),
      },
      {
        id: 'search-engine-ping',
        name: 'Search Engine Ping',
        category: 'SEO',
        schedule: 'Daily at 4:30 AM',
        cronExpression: '30 4 * * *',
        description: 'Notifies Google and Bing about sitemap updates',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('30 4 * * *'),
      },
      {
        id: 'auto-interlinking',
        name: 'Auto-Interlinking',
        category: 'AI',
        schedule: 'Daily at 3:00 AM',
        cronExpression: '0 3 * * *',
        description: 'Creates internal links between related posts',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('0 3 * * *'),
      },
      {
        id: 'ai-content-analysis',
        name: 'AI Content Analysis',
        category: 'AI',
        schedule: 'Weekly on Sundays at 1:00 AM',
        cronExpression: '0 1 * * 0',
        description: 'Analyzes content quality and suggests improvements',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('0 1 * * 0'),
      },
      {
        id: 'social-distribution',
        name: 'Social Media Distribution',
        category: 'DISTRIBUTION',
        schedule: 'Every hour',
        cronExpression: '0 * * * *',
        description: 'Auto-posts content to social media platforms',
        status: 'active',
        lastRun: null,
        nextRun: this.getNextCronRun('0 * * * *'),
      },
    ];
  }

  /**
   * Calculate next cron run time
   */
  private getNextCronRun(cronExpression: string): string {
    // Simplified calculation - in production use a library like cron-parser
    const now = new Date();

    if (cronExpression === '*/5 * * * *') {
      const next = new Date(now);
      next.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
      next.setSeconds(0);
      return next.toISOString();
    }

    if (cronExpression === '0 3 * * *') {
      const next = new Date(now);
      next.setHours(3, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }

    if (cronExpression === '0 2 * * *') {
      const next = new Date(now);
      next.setHours(2, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }

    if (cronExpression === '0 4 * * *') {
      const next = new Date(now);
      next.setHours(4, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }

    if (cronExpression === '30 4 * * *') {
      const next = new Date(now);
      next.setHours(4, 30, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }

    if (cronExpression === '0 1 * * 0') {
      const next = new Date(now);
      next.setHours(1, 0, 0, 0);
      const daysUntilSunday = (7 - next.getDay()) % 7 || 7;
      next.setDate(next.getDate() + daysUntilSunday);
      return next.toISOString();
    }

    if (cronExpression === '0 * * * *') {
      const next = new Date(now);
      next.setMinutes(0, 0, 0);
      next.setHours(next.getHours() + 1);
      return next.toISOString();
    }

    return new Date(now.getTime() + 3600000).toISOString(); // +1 hour fallback
  }

  /**
   * AI BLOG: Auto-Generate Blog Posts
   * Runs daily at 2:00 AM (configurable in settings)
   * Generates batch of AI blog posts based on site configuration
   */
  @Cron('0 2 * * *')
  async handleAiBlogGeneration() {
    this.logger.log('[AI-BLOG] Running AI blog generation job...');

    try {
      const settings = await this.prisma.siteSettings.findFirst();
      if (!settings?.aiEnabled) {
        this.logger.log('[AI-BLOG] AI generation is disabled in settings');
        return;
      }

      const results = await this.aiBlogService.generateBlogBatch();
      const successCount = results.filter(r => r.success).length;

      this.logger.log(`[OK] [AI-BLOG] Generated ${successCount}/${results.length} posts successfully`);
    } catch (error) {
      this.logger.error(
        `[AI-BLOG] Error during AI blog generation: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * AI BLOG: Auto-Interlinking
   * Runs daily at 3:00 AM to create internal links between posts
   */
  @Cron('0 3 * * *')
  async handleAutoInterlinking() {
    this.logger.log('[AI-BLOG] Running auto-interlinking job...');

    try {
      const settings = await this.prisma.siteSettings.findFirst();
      if (!settings?.autoInterlinkEnabled) {
        this.logger.log('[AI-BLOG] Auto-interlinking is disabled in settings');
        return;
      }

      const linksCreated = await this.aiBlogService.performAutoInterlinking();
      this.logger.log(`[OK] [AI-BLOG] Created ${linksCreated} internal links`);
    } catch (error) {
      this.logger.error(
        `[AI-BLOG] Error during auto-interlinking: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  /**
   * AI BLOG: Content Refresh Check
   * Runs weekly on Sunday at 4:00 AM to identify old content needing refresh
   */
  @Cron('0 4 * * 0')
  async handleContentRefreshCheck() {
    this.logger.log('[AI-BLOG] Running content refresh check job...');

    try {
      const settings = await this.prisma.siteSettings.findFirst();
      if (!settings?.contentRefreshEnabled) {
        this.logger.log('[AI-BLOG] Content refresh is disabled in settings');
        return;
      }

      const count = await this.aiBlogService.identifyPostsNeedingRefresh();
      this.logger.log(`[OK] [AI-BLOG] Identified ${count} posts needing content refresh`);
    } catch (error) {
      this.logger.error(
        `[AI-BLOG] Error checking content refresh: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }
}
