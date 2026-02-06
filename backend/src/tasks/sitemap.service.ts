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

type SitemapChangefreq = SitemapUrl['changefreq'];

type SitemapCustomUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: SitemapChangefreq;
  priority?: number;
};

type SitemapConfig = {
  enabled: boolean;
  baseUrl?: string;
  include: {
    staticPages: boolean;
    blogPosts: boolean;
    categories: boolean;
    tags: boolean;
    pages: boolean;
  };
  exclude: {
    posts: string[];
    categories: string[];
    tags: string[];
    pages: string[];
  };
  staticUrls: SitemapCustomUrl[];
  customUrls: SitemapCustomUrl[];
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const parseStringArray = (value: unknown): string[] => (
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '').map((item) => item.trim())
    : []
);

const parseChangefreq = (value: unknown): SitemapChangefreq | undefined => {
  const parsed = parseString(value);
  if (!parsed) return undefined;
  const allowed: SitemapChangefreq[] = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  return allowed.includes(parsed as SitemapChangefreq) ? (parsed as SitemapChangefreq) : undefined;
};

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  private readonly sitemapPath = path.join(__dirname, '../../../public/sitemap.xml');

  constructor(private readonly prisma: PrismaService) {}

  private normalizeBaseUrl(value: string): string {
    if (!value) return this.baseUrl;
    return value.endsWith('/') ? value.slice(0, -1) : value;
  }

  private parseSitemapConfig(value: unknown): SitemapConfig {
    const defaultConfig: SitemapConfig = {
      enabled: true,
      baseUrl: undefined,
      include: {
        staticPages: true,
        blogPosts: true,
        categories: true,
        tags: true,
        pages: true,
      },
      exclude: {
        posts: [],
        categories: [],
        tags: [],
        pages: [],
      },
      staticUrls: [],
      customUrls: [],
    };

    if (!isRecord(value)) {
      return defaultConfig;
    }

    const includeRaw = isRecord(value.include) ? value.include : {};
    const excludeRaw = isRecord(value.exclude) ? value.exclude : {};

    const staticUrls = Array.isArray(value.staticUrls)
      ? value.staticUrls
          .filter(isRecord)
          .map((entry) => ({
            loc: parseString(entry.loc) || '',
            lastmod: parseString(entry.lastmod),
            changefreq: parseChangefreq(entry.changefreq),
            priority: typeof entry.priority === 'number' ? entry.priority : undefined,
          }))
          .filter((entry) => entry.loc)
      : [];

    const customUrls = Array.isArray(value.customUrls)
      ? value.customUrls
          .filter(isRecord)
          .map((entry) => ({
            loc: parseString(entry.loc) || '',
            lastmod: parseString(entry.lastmod),
            changefreq: parseChangefreq(entry.changefreq),
            priority: typeof entry.priority === 'number' ? entry.priority : undefined,
          }))
          .filter((entry) => entry.loc)
      : [];

    return {
      enabled: typeof value.enabled === 'boolean' ? value.enabled : defaultConfig.enabled,
      baseUrl: parseString(value.baseUrl),
      include: {
        staticPages: typeof includeRaw.staticPages === 'boolean' ? includeRaw.staticPages : defaultConfig.include.staticPages,
        blogPosts: typeof includeRaw.blogPosts === 'boolean' ? includeRaw.blogPosts : defaultConfig.include.blogPosts,
        categories: typeof includeRaw.categories === 'boolean' ? includeRaw.categories : defaultConfig.include.categories,
        tags: typeof includeRaw.tags === 'boolean' ? includeRaw.tags : defaultConfig.include.tags,
        pages: typeof includeRaw.pages === 'boolean' ? includeRaw.pages : defaultConfig.include.pages,
      },
      exclude: {
        posts: parseStringArray(excludeRaw.posts),
        categories: parseStringArray(excludeRaw.categories),
        tags: parseStringArray(excludeRaw.tags),
        pages: parseStringArray(excludeRaw.pages),
      },
      staticUrls,
      customUrls,
    };
  }

  private resolveUrl(loc: string, baseUrl: string): string {
    if (loc.startsWith('http://') || loc.startsWith('https://')) {
      return loc;
    }
    const normalized = loc.startsWith('/') ? loc : `/${loc}`;
    return `${baseUrl}${normalized}`;
  }

  private normalizeCustomUrls(
    entries: SitemapCustomUrl[],
    baseUrl: string,
    defaults: { changefreq: SitemapChangefreq; priority: number },
  ): SitemapUrl[] {
    return entries.map((entry) => {
      const rawPriority = typeof entry.priority === 'number' ? entry.priority : defaults.priority;
      const priority = Math.min(1, Math.max(0, rawPriority));
      return {
        loc: this.resolveUrl(entry.loc, baseUrl),
        lastmod: entry.lastmod ? new Date(entry.lastmod).toISOString() : new Date().toISOString(),
        changefreq: entry.changefreq || defaults.changefreq,
        priority,
      };
    });
  }

  private async loadSitemapConfig(): Promise<{ config: SitemapConfig; baseUrl: string }> {
    const settings = await this.prisma.siteSettings.findFirst({
      select: { sitemapConfig: true },
    });
    const config = this.parseSitemapConfig(settings?.sitemapConfig);
    const baseUrl = this.normalizeBaseUrl(config.baseUrl || this.baseUrl);
    return { config, baseUrl };
  }

  /**
   * Generate complete XML sitemap
   */
  async generateSitemap(): Promise<string> {
    this.logger.log('Generating XML sitemap...');

    const { config, baseUrl } = await this.loadSitemapConfig();

    if (!config.enabled) {
      this.logger.warn('[SEO] Sitemap generation skipped (disabled in settings).');
      return this.generateXML([]);
    }

    const urls: SitemapUrl[] = [];
    const excludedPosts = new Set(config.exclude.posts);
    const excludedCategories = new Set(config.exclude.categories);
    const excludedTags = new Set(config.exclude.tags);
    const excludedPages = new Set(config.exclude.pages);

    // Static pages
    if (config.include.staticPages) {
      urls.push(
        {
          loc: `${baseUrl}/`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 1.0,
        },
        {
          loc: `${baseUrl}/blog`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.9,
        },
        {
          loc: `${baseUrl}/contact`,
          lastmod: new Date().toISOString(),
          changefreq: 'monthly',
          priority: 0.8,
        },
      );
    }

    if (config.staticUrls.length > 0) {
      urls.push(...this.normalizeCustomUrls(config.staticUrls, baseUrl, { changefreq: 'monthly', priority: 0.5 }));
    }

    // Blog posts (published only)
    if (config.include.blogPosts) {
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
        if (excludedPosts.has(post.slug)) continue;

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
          loc: `${baseUrl}/blog/${post.slug}`,
          lastmod: post.updatedAt.toISOString(),
          changefreq: daysSincePublished < 30 ? 'weekly' : 'monthly',
          priority,
        });
      }
    }

    // Blog categories
    if (config.include.categories) {
      const categories = await this.prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      });

      for (const category of categories) {
        if (excludedCategories.has(category.slug)) continue;
        urls.push({
          loc: `${baseUrl}/blog?category=${category.slug}`,
          lastmod: category.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: 0.6,
        });
      }
    }

    // Blog tags (trending tags get higher priority)
    if (config.include.tags) {
      const tags = await this.prisma.tag.findMany({
        select: { slug: true, updatedAt: true, trending: true },
      });

      for (const tag of tags) {
        if (excludedTags.has(tag.slug)) continue;
        urls.push({
          loc: `${baseUrl}/blog?tag=${tag.slug}`,
          lastmod: tag.updatedAt.toISOString(),
          changefreq: 'weekly',
          priority: tag.trending ? 0.7 : 0.5,
        });
      }
    }

    // Pages (published only, exclude homepage which is already included)
    if (config.include.pages) {
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
        if (excludedPages.has(page.slug)) continue;

        // Calculate priority based on page type and views
        let priority = 0.7;
        if (page.pageType === 'HOMEPAGE' || page.pageType === 'LANDING') priority = 0.9;
        else if (page.pageType === 'STATIC') priority = 0.8;
        
        if (page.viewCount > 100) priority = Math.min(priority + 0.1, 1.0);
        else if (page.viewCount > 50) priority = Math.min(priority + 0.05, 1.0);

        urls.push({
          loc: `${baseUrl}/${page.slug === '(home)' ? '' : page.slug}`,
          lastmod: page.updatedAt.toISOString(),
          changefreq: 'monthly',
          priority,
        });
      }
    }

    if (config.customUrls.length > 0) {
      urls.push(...this.normalizeCustomUrls(config.customUrls, baseUrl, { changefreq: 'monthly', priority: 0.5 }));
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
      this.logger.log(`[SEO] Sitemap saved to ${this.sitemapPath}`);
    } catch (error) {
      this.logger.warn(`Could not save sitemap to file: ${error.message}`);
    }

    return xml;
  }

  /**
   * Generate sitemap index for large sites (split by category)
   */
  async generateSitemapIndex(): Promise<string> {
    const { baseUrl } = await this.loadSitemapConfig();
    const sitemaps = [
      { loc: `${baseUrl}/sitemap-static.xml`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/sitemap-blog.xml`, lastmod: new Date().toISOString() },
      { loc: `${baseUrl}/sitemap-tags.xml`, lastmod: new Date().toISOString() },
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
    const { config, baseUrl } = await this.loadSitemapConfig();

    if (!config.enabled || !config.include.blogPosts) {
      return this.generateXML([]);
    }

    const excludedPosts = new Set(config.exclude.posts);
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

    const urls: SitemapUrl[] = posts
      .filter((post) => !excludedPosts.has(post.slug))
      .map((post) => {
      let priority = 0.7;
      if (post.viewCount > 100) priority = 0.9;
      else if (post.viewCount > 50) priority = 0.8;

      const daysSincePublished = Math.floor(
        (Date.now() - new Date(post.publishedAt || post.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSincePublished < 7) priority = Math.min(priority + 0.1, 1.0);

      return {
        loc: `${baseUrl}/blog/${post.slug}`,
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
    const { config, baseUrl } = await this.loadSitemapConfig();

    if (!config.enabled) {
      return {
        totalUrls: 0,
        staticPages: 0,
        blogPosts: 0,
        categories: 0,
        tags: 0,
        pages: 0,
        customUrls: config.customUrls.length,
        staticCustomUrls: config.staticUrls.length,
        lastGenerated: new Date().toISOString(),
        baseUrl,
        enabled: false,
      };
    }

    const excludedPosts = config.exclude.posts;
    const excludedCategories = config.exclude.categories;
    const excludedTags = config.exclude.tags;
    const excludedPages = config.exclude.pages;

    const [postsCount, categoriesCount, tagsCount, pagesCount] = await Promise.all([
      config.include.blogPosts
        ? this.prisma.post.count({
            where: {
              status: 'PUBLISHED',
              slug: excludedPosts.length > 0 ? { notIn: excludedPosts } : undefined,
            },
          })
        : Promise.resolve(0),
      config.include.categories
        ? this.prisma.category.count({
            where: excludedCategories.length > 0 ? { slug: { notIn: excludedCategories } } : undefined,
          })
        : Promise.resolve(0),
      config.include.tags
        ? this.prisma.tag.count({
            where: excludedTags.length > 0 ? { slug: { notIn: excludedTags } } : undefined,
          })
        : Promise.resolve(0),
      config.include.pages
        ? this.prisma.page.count({
            where: {
              status: 'PUBLISHED',
              slug: {
                notIn: ['(home)', ...excludedPages],
              },
            },
          })
        : Promise.resolve(0),
    ]);

    const staticPages = config.include.staticPages ? 3 : 0;
    const staticCustomUrls = config.staticUrls.length;
    const customUrls = config.customUrls.length;
    const totalUrls = staticPages + staticCustomUrls + customUrls + postsCount + categoriesCount + tagsCount + pagesCount;

    return {
      totalUrls,
      staticPages,
      blogPosts: postsCount,
      categories: categoriesCount,
      tags: tagsCount,
      pages: pagesCount,
      customUrls,
      staticCustomUrls,
      lastGenerated: new Date().toISOString(),
      baseUrl,
      enabled: true,
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
