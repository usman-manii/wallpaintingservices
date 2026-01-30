import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AiBlogService } from './ai-blog.service';

@Controller('blog/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiBlogController {
  constructor(private readonly aiBlogService: AiBlogService) {}

  /**
   * Generate batch of AI blog posts
   * POST /blog/ai/generate-batch
   */
  @Post('generate-batch')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  async generateBatch(
    @Body() data: { keywords?: string[]; count?: number },
  ) {
    const results = await this.aiBlogService.generateBlogBatch(
      data.keywords,
      data.count,
    );
    return {
      success: true,
      generated: results.filter(r => r.success).length,
      total: results.length,
      results,
    };
  }

  /**
   * Auto-tag a human-written post
   * POST /blog/ai/auto-tag/:postId
   */
  @Post('auto-tag/:postId')
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  async autoTag(@Param('postId') postId: string) {
    const tags = await this.aiBlogService.autoTagHumanPost(postId);
    return {
      success: true,
      tags,
      message: `Auto-tagged with ${tags.length} tags`,
    };
  }

  /**
   * Perform auto-interlinking across all posts
   * POST /blog/ai/interlink
   */
  @Post('interlink')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  async performInterlinking() {
    const linksCreated = await this.aiBlogService.performAutoInterlinking();
    return {
      success: true,
      linksCreated,
      message: `Created ${linksCreated} internal links`,
    };
  }

  /**
   * Get interlinking statistics
   * GET /blog/ai/interlink/stats
   */
  @Get('interlink/stats')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  async getInterlinkingStats() {
    return await this.aiBlogService.getInterlinkingStats();
  }

  /**
   * Get internal links list
   * GET /blog/ai/interlink/list
   */
  @Get('interlink/list')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  async getInternalLinks(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.aiBlogService.getInternalLinks(+page, +limit);
  }

  /**
   * Identify posts needing content refresh
   * POST /blog/ai/check-refresh
   */
  @Post('check-refresh')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  async checkRefresh() {
    const count = await this.aiBlogService.identifyPostsNeedingRefresh();
    return {
      success: true,
      postsMarked: count,
      message: `Identified ${count} posts needing refresh`,
    };
  }

  /**
   * Refresh old content for a specific post
   * POST /blog/ai/refresh/:postId
   */
  @Post('refresh/:postId')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  async refreshPost(@Param('postId') postId: string) {
    const result = await this.aiBlogService.refreshOldContent(postId);
    return result;
  }

  /**
   * Validate post meets requirements
   * GET /blog/ai/validate/:postId
   */
  @Get('validate/:postId')
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  async validatePost(@Param('postId') postId: string) {
    const validation = await this.aiBlogService.validatePostRequirements(postId);
    return {
      success: validation.valid,
      ...validation,
    };
  }

  /**
   * Get AI statistics for dashboard
   * GET /blog/ai/statistics
   */
  @Get('statistics')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  async getStatistics() {
    const stats = await this.aiBlogService.getAiStatistics();
    return {
      success: true,
      statistics: stats,
    };
  }
}
