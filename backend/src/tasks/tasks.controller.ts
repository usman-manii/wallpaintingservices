// backend/src/tasks/tasks.controller.ts
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SitemapService } from './sitemap.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly sitemapService: SitemapService,
  ) {}

  /**
   * Get all cron jobs info
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('cron-jobs')
  getAllCronJobs() {
    return this.tasksService.getAllCronJobs();
  }

  /**
   * Get sitemap statistics
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('sitemap/stats')
  async getSitemapStats() {
    return this.sitemapService.getSitemapStats();
  }

  /**
   * Manually trigger sitemap generation
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('sitemap/generate')
  async generateSitemap() {
    const xml = await this.sitemapService.generateSitemap();
    const stats = await this.sitemapService.getSitemapStats();
    
    return {
      message: 'Sitemap generated successfully',
      stats,
    };
  }

  /**
   * Manually trigger scheduled post publishing
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('trigger/scheduled-posts')
  async triggerScheduledPosts() {
    await this.tasksService.handleScheduledPosts();
    return { message: 'Scheduled posts job triggered' };
  }

  /**
   * Manually trigger trending tags update
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('trigger/trending-tags')
  async triggerTrendingTags() {
    await this.tasksService.handleTrendingTags();
    return { message: 'Trending tags update triggered' };
  }

  /**
   * Manually trigger database cleanup
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('trigger/database-cleanup')
  async triggerDatabaseCleanup() {
    await this.tasksService.handleDatabaseCleanup();
    return { message: 'Database cleanup triggered' };
  }

  /**
   * Manually trigger auto-interlinking
   */
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('trigger/auto-interlinking')
  async triggerAutoInterlinking() {
    await this.tasksService.handleAutoInterlinking();
    return { message: 'Auto-interlinking job triggered' };
  }
}
