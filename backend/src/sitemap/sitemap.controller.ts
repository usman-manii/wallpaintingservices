// backend/src/sitemap/sitemap.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { SitemapService } from '../tasks/sitemap.service';
import { Public } from '../auth/public.decorator';

@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  /**
   * Public sitemap.xml endpoint
   */
  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap() {
    return this.sitemapService.generateSitemap();
  }

  /**
   * Blog-specific sitemap
   */
  @Public()
  @Get('sitemap-blog.xml')
  @Header('Content-Type', 'application/xml')
  async getBlogSitemap() {
    return this.sitemapService.generateBlogSitemap();
  }

  /**
   * Sitemap index (for large sites)
   */
  @Public()
  @Get('sitemap-index.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemapIndex() {
    return this.sitemapService.generateSitemapIndex();
  }
}
