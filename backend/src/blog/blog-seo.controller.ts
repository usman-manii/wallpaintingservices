// backend/src/blog/blog-seo.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('blog/seo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogSEOController {
  private readonly logger = new Logger(BlogSEOController.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Bulk enhance SEO for all posts missing fields
   */
  @Post('enhance-all')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  async enhanceAllPosts() {
    this.logger.log('🚀 Starting bulk SEO enhancement...');

    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { seoTitle: null },
          { seoDescription: null },
          { seoKeywords: { isEmpty: true } },
          { excerpt: null },
          { readingTime: null },
        ],
      },
      include: { tags: true, categories: true },
    });

    const results = {
      total: posts.length,
      updated: 0,
      failed: 0,
      details: [] as any[],
    };

    for (const post of posts) {
      try {
        const updates: any = {};

        // Generate SEO Title
        if (!post.seoTitle) {
          updates.seoTitle = this.generateSEOTitle(post.title);
        }

        // Generate SEO Description
        if (!post.seoDescription) {
          updates.seoDescription = this.generateSEODescription(post.content, post.excerpt);
        }

        // Generate Excerpt
        if (!post.excerpt) {
          updates.excerpt = this.generateExcerpt(post.content);
        }

        // Extract Keywords
        if (!post.seoKeywords || post.seoKeywords.length === 0) {
          updates.seoKeywords = this.extractKeywords(
            post.content,
            post.title,
            post.tags.map(t => t.name)
          );
        }

        // Calculate Reading Time
        if (!post.readingTime) {
          updates.readingTime = this.calculateReadingTime(post.content);
        }

        // Generate Open Graph fields
        if (!post.ogTitle) updates.ogTitle = updates.seoTitle || post.seoTitle;
        if (!post.ogDescription) updates.ogDescription = updates.seoDescription || post.seoDescription;
        if (!post.twitterCard) updates.twitterCard = 'summary_large_image';

        if (Object.keys(updates).length > 0) {
          await this.prisma.post.update({
            where: { id: post.id },
            data: updates,
          });
          results.updated++;
          results.details.push({
            id: post.id,
            title: post.title,
            fieldsUpdated: Object.keys(updates),
          });
        }
      } catch (error) {
        results.failed++;
        this.logger.error(`Failed to enhance post ${post.id}:`, error);
      }
    }

    this.logger.log(`✅ Bulk enhancement complete: ${results.updated} updated, ${results.failed} failed`);
    return results;
  }

  /**
   * Enhance SEO for a single post
   */
  @Post('enhance/:postId')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  async enhancePost(@Param('postId') postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true, categories: true },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const updates: any = {};

    if (!post.seoTitle) {
      updates.seoTitle = this.generateSEOTitle(post.title);
    }

    if (!post.seoDescription) {
      updates.seoDescription = this.generateSEODescription(post.content, post.excerpt);
    }

    if (!post.excerpt) {
      updates.excerpt = this.generateExcerpt(post.content);
    }

    if (!post.seoKeywords || post.seoKeywords.length === 0) {
      updates.seoKeywords = this.extractKeywords(
        post.content,
        post.title,
        post.tags.map(t => t.name)
      );
    }

    if (!post.readingTime) {
      updates.readingTime = this.calculateReadingTime(post.content);
    }

    if (!post.ogTitle) updates.ogTitle = updates.seoTitle || post.seoTitle;
    if (!post.ogDescription) updates.ogDescription = updates.seoDescription || post.seoDescription;
    if (!post.twitterCard) updates.twitterCard = 'summary_large_image';

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: updates,
    });

    return {
      success: true,
      fieldsUpdated: Object.keys(updates),
      post: updated,
    };
  }

  /**
   * Get SEO statistics
   */
  @Get('stats')
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  async getStats() {
    const total = await this.prisma.post.count();
    
    const missing = {
      seoTitle: await this.prisma.post.count({ where: { seoTitle: null } }),
      seoDescription: await this.prisma.post.count({ where: { seoDescription: null } }),
      excerpt: await this.prisma.post.count({ where: { excerpt: null } }),
      keywords: await this.prisma.post.count({ where: { seoKeywords: { isEmpty: true } } }),
      readingTime: await this.prisma.post.count({ where: { readingTime: null } }),
      ogTitle: await this.prisma.post.count({ where: { ogTitle: null } }),
      ogDescription: await this.prisma.post.count({ where: { ogDescription: null } }),
    };

    const needsEnhancement = await this.prisma.post.count({
      where: {
        OR: [
          { seoTitle: null },
          { seoDescription: null },
          { seoKeywords: { isEmpty: true } },
          { excerpt: null },
          { readingTime: null },
        ],
      },
    });

    return {
      total,
      complete: total - needsEnhancement,
      needsEnhancement,
      missing,
      completionPercentage: total > 0 ? Math.round(((total - needsEnhancement) / total) * 100) : 100,
    };
  }

  // Helper methods
  private generateSEOTitle(title: string): string {
    const year = new Date().getFullYear();
    if (title.length < 50) {
      return `${title} - Complete Guide (${year})`;
    }
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  private generateSEODescription(content: string, excerpt?: string): string {
    if (excerpt && excerpt.length >= 120 && excerpt.length <= 160) {
      return excerpt;
    }

    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (plainText.length > 155) {
      return plainText.substring(0, 155) + '...';
    }
    
    return plainText + ' Learn more in this comprehensive guide.';
  }

  private generateExcerpt(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const firstSentence = plainText.match(/^[^.!?]+[.!?]/)?.[0];
    if (firstSentence && firstSentence.length >= 100 && firstSentence.length <= 200) {
      return firstSentence.trim();
    }

    return plainText.length > 150 ? plainText.substring(0, 147) + '...' : plainText;
  }

  private extractKeywords(content: string, title: string, existingTags: string[]): string[] {
    const plainText = (content + ' ' + title).toLowerCase().replace(/<[^>]*>/g, ' ');
    
    const words = plainText.match(/\b\w{4,}\b/g) || [];
    
    const frequency: { [key: string]: number } = {};
    const stopWords = ['this', 'that', 'with', 'from', 'have', 'will', 'your', 'they', 'been', 'more', 'when', 'them', 'some', 'than', 'very', 'just', 'into', 'also', 'only', 'over', 'such', 'even', 'most', 'made'];
    
    words.forEach(word => {
      if (!stopWords.includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    const topKeywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    const allKeywords = [...new Set([...topKeywords, ...existingTags.map(t => t.toLowerCase())])];

    return allKeywords.slice(0, 15);
  }

  private calculateReadingTime(content: string): number {
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const wordCount = plainText.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }
}
