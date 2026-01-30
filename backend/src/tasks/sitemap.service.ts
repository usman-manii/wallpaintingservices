// backend/src/tasks/sitemap.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly sitemapPath = path.join(__dirname, '../../../public/sitemap.xml');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate complete XML sitemap
   */
  async generateSitemap(): Promise<string> {
    this.logger.log('Generating XML sitemap...');

    const urls: SitemapUrl[] = [];

    // Static pages
    urls.push(
      {
        loc: `${this.baseUrl}/`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${this.baseUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        loc: `${this.baseUrl}/contact`,
        lastmod: new Date().toISOString(),
        changefreq: 'monthly',
        priority: 0.8,
      },
    );

    // Blog posts (published only)
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        viewCount: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    for (const post of posts) {
      // Calculate priority based on views and recency
      let priority = 0.7;
      if (post.viewCount > 100) priority = 0.9;
      else if (post.viewCount > 50) priority = 0.8;

      const daysSincePublished = Math.floor(
        (Date.now() - new Date(post.publishedAt || post.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Recent posts get higher priority
      if (daysSincePublished < 7) priority = Math.min(priority + 0.1, 1.0);

      urls.push({
        loc: `${this.baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt.toISOString(),
        changefreq: daysSincePublished < 30 ? 'weekly' : 'monthly',
        priority,
      });
    }

    // Blog categories
    const categories = await this.prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    });

    for (const category of categories) {
      urls.push({
        loc: `${this.baseUrl}/blog?category=${category.slug}`,
        lastmod: category.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.6,
      });
    }

    // Blog tags (trending tags get higher priority)
    const tags = await this.prisma.tag.findMany({
      select: { slug: true, updatedAt: true, trending: true },
    });

    for (const tag of tags) {
      urls.push({
        loc: `${this.baseUrl}/blog?tag=${tag.slug}`,
        lastmod: tag.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: tag.trending ? 0.7 : 0.5,
      });
    }

    // Pages (published only, exclude homepage which is already included)
    const pages = await this.prisma.page.findMany({
      where: { 
        status: 'PUBLISHED',
        slug: { not: '(home)' } // Exclude homepage as it's already in static pages
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        viewCount: true,
        pageType: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    for (const page of pages) {
      // Calculate priority based on page type and views
      let priority = 0.7;
      if (page.pageType === 'HOMEPAGE' || page.pageType === 'LANDING') priority = 0.9;
      else if (page.pageType === 'STATIC') priority = 0.8;
      
      if (page.viewCount > 100) priority = Math.min(priority + 0.1, 1.0);
      else if (page.viewCount > 50) priority = Math.min(priority + 0.05, 1.0);

      urls.push({
        loc: `${this.baseUrl}/${page.slug === '(home)' ? '' : page.slug}`,
        lastmod: page.updatedAt.toISOString(),
        changefreq: 'monthly',
        priority,
      });
    }

    // Generate XML
    const xml = this.generateXML(urls);

    // Save to file (optional - for static hosting)
    try {
      const publicDir = path.dirname(this.sitemapPath);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(this.sitemapPath, xml, 'utf-8');
      this.logger.log(`✅ Sitemap saved to ${this.sitemapPath}`);
    } catch (error) {
      this.logger.warn(`Could not save sitemap to file: ${error.message}`);
    }

    return xml;
  }

  /**
   * Generate sitemap index for large sites (split by category)
   */
  async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      { loc: `${this.baseUrl}/sitemap-static.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.baseUrl}/sitemap-blog.xml`, lastmod: new Date().toISOString() },
      { loc: `${this.baseUrl}/sitemap-tags.xml`, lastmod: new Date().toISOString() },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const sitemap of sitemaps) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${sitemap.loc}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }

    xml += '</sitemapindex>';

    return xml;
  }

  /**
   * Generate blog-specific sitemap
   */
  async generateBlogSitemap(): Promise<string> {
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        viewCount: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    const urls: SitemapUrl[] = posts.map((post) => {
      let priority = 0.7;
      if (post.viewCount > 100) priority = 0.9;
      else if (post.viewCount > 50) priority = 0.8;

      const daysSincePublished = Math.floor(
        (Date.now() - new Date(post.publishedAt || post.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSincePublished < 7) priority = Math.min(priority + 0.1, 1.0);

      return {
        loc: `${this.baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt.toISOString(),
        changefreq: daysSincePublished < 30 ? 'weekly' : 'monthly',
        priority,
      };
    });

    return this.generateXML(urls);
  }

  /**
   * Get sitemap statistics
   */
  async getSitemapStats() {
    const [postsCount, categoriesCount, tagsCount, pagesCount] = await Promise.all([
      this.prisma.post.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.category.count(),
      this.prisma.tag.count(),
      this.prisma.page.count({ where: { status: 'PUBLISHED' } }),
    ]);

    const totalUrls = 3 + postsCount + categoriesCount + tagsCount + pagesCount; // 3 static pages

    return {
      totalUrls,
      staticPages: 3,
      blogPosts: postsCount,
      categories: categoriesCount,
      tags: tagsCount,
      pages: pagesCount,
      lastGenerated: new Date().toISOString(),
      baseUrl: this.baseUrl,
    };
  }

  /**
   * Generate XML string from URLs
   */
  private generateXML(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return xml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}
