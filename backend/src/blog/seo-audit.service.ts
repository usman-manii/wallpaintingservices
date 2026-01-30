import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SEOAuditResult {
  score: number;
  passed: number;
  warnings: number;
  failed: number;
  checks: SEOCheck[];
  recommendations: string[];
}

export interface SEOCheck {
  category: 'Critical' | 'Important' | 'Optional';
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  impact: string;
}

@Injectable()
export class SEOAuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Comprehensive SEO audit for a single post
   */
  async auditPost(postId: string): Promise<SEOAuditResult> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: true,
        categories: true,
        tags: true,
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const checks: SEOCheck[] = [];

    // CRITICAL CHECKS
    checks.push(this.checkTitle(post.title, post.seoTitle));
    checks.push(this.checkMetaDescription(post.seoDescription, post.excerpt));
    checks.push(this.checkSlug(post.slug));
    checks.push(this.checkContentLength(post.content));

    // IMPORTANT CHECKS
    checks.push(this.checkKeywords(post.seoKeywords));
    checks.push(this.checkHeadings(post.content));
    checks.push(this.checkImages(post.content, post.featuredImage));
    checks.push(this.checkInternalLinks(post.content));
    checks.push(this.checkExternalLinks(post.content));

    // OPTIONAL CHECKS
    checks.push(this.checkOpenGraph(post.ogTitle, post.ogDescription, post.ogImage));
    checks.push(this.checkTwitterCard(post.twitterCard));
    checks.push(this.checkReadingTime(post.readingTime));
    checks.push(this.checkCategories(post.categories.length));
    checks.push(this.checkTags(post.tags.length));
    checks.push(this.checkPublishDate(post.publishedAt));

    // Calculate score
    const passed = checks.filter(c => c.status === 'pass').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const score = Math.round((passed / checks.length) * 100);

    // Generate recommendations
    const recommendations = this.generateRecommendations(checks);

    return {
      score,
      passed,
      warnings,
      failed,
      checks,
      recommendations,
    };
  }

  /**
   * Site-wide SEO audit
   */
  async auditSite(): Promise<{
    overallScore: number;
    posts: { id: string; title: string; score: number }[];
    globalIssues: string[];
    summary: {
      totalPosts: number;
      avgScore: number;
      postsWithIssues: number;
      criticalIssues: number;
    };
  }> {
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true },
      take: 100,
    });

    const auditResults = await Promise.all(
      posts.map(async post => {
        const audit = await this.auditPost(post.id);
        return { id: post.id, title: post.title, score: audit.score };
      })
    );

    const avgScore = Math.round(
      auditResults.reduce((sum, r) => sum + r.score, 0) / auditResults.length
    );

    const postsWithIssues = auditResults.filter(r => r.score < 80).length;
    const criticalIssues = auditResults.filter(r => r.score < 50).length;

    const globalIssues: string[] = [];
    if (avgScore < 70) {
      globalIssues.push('⚠️ Average SEO score is below 70%. Review and optimize content.');
    }
    if (criticalIssues > 0) {
      globalIssues.push(`🚨 ${criticalIssues} posts have critical SEO issues (score < 50).`);
    }
    if (postsWithIssues > posts.length / 2) {
      globalIssues.push('⚠️ More than half of posts need SEO improvements.');
    }

    return {
      overallScore: avgScore,
      posts: auditResults,
      globalIssues,
      summary: {
        totalPosts: posts.length,
        avgScore,
        postsWithIssues,
        criticalIssues,
      },
    };
  }

  // ============ INDIVIDUAL SEO CHECKS ============

  private checkTitle(title: string, seoTitle?: string): SEOCheck {
    const effectiveTitle = seoTitle || title;
    const length = effectiveTitle.length;

    if (length < 30) {
      return {
        category: 'Critical',
        name: 'Title Length',
        status: 'fail',
        message: `Title is too short (${length} chars). Minimum: 30 characters.`,
        impact: 'Search engines may not display your title properly',
      };
    }
    if (length > 60) {
      return {
        category: 'Critical',
        name: 'Title Length',
        status: 'warning',
        message: `Title is too long (${length} chars). Recommended: 50-60 characters.`,
        impact: 'Title may be truncated in search results',
      };
    }
    return {
      category: 'Critical',
      name: 'Title Length',
      status: 'pass',
      message: `Title length is optimal (${length} chars)`,
      impact: 'Good for search visibility',
    };
  }

  private checkMetaDescription(seoDescription?: string, excerpt?: string): SEOCheck {
    const description = seoDescription || excerpt || '';
    const length = description.length;

    if (length === 0) {
      return {
        category: 'Critical',
        name: 'Meta Description',
        status: 'fail',
        message: 'Meta description is missing',
        impact: 'Search engines will generate their own description, reducing click-through rates',
      };
    }
    if (length < 120) {
      return {
        category: 'Critical',
        name: 'Meta Description',
        status: 'warning',
        message: `Meta description is too short (${length} chars). Minimum: 120 characters.`,
        impact: 'May not provide enough information to users',
      };
    }
    if (length > 160) {
      return {
        category: 'Critical',
        name: 'Meta Description',
        status: 'warning',
        message: `Meta description is too long (${length} chars). Recommended: 120-160 characters.`,
        impact: 'Description may be truncated in search results',
      };
    }
    return {
      category: 'Critical',
      name: 'Meta Description',
      status: 'pass',
      message: `Meta description length is optimal (${length} chars)`,
      impact: 'Good for search visibility',
    };
  }

  private checkSlug(slug: string): SEOCheck {
    const hasUpperCase = /[A-Z]/.test(slug);
    const hasSpaces = /\s/.test(slug);
    const hasSpecialChars = /[^a-z0-9-]/.test(slug);
    const length = slug.length;

    if (hasUpperCase || hasSpaces || hasSpecialChars) {
      return {
        category: 'Critical',
        name: 'URL Structure',
        status: 'fail',
        message: 'Slug contains uppercase letters, spaces, or special characters',
        impact: 'Poor URL structure affects SEO and user experience',
      };
    }
    if (length > 60) {
      return {
        category: 'Critical',
        name: 'URL Structure',
        status: 'warning',
        message: `Slug is too long (${length} chars). Recommended: < 60 characters.`,
        impact: 'Long URLs are harder to share and remember',
      };
    }
    return {
      category: 'Critical',
      name: 'URL Structure',
      status: 'pass',
      message: 'URL structure is SEO-friendly',
      impact: 'Good for search rankings and user experience',
    };
  }

  private checkContentLength(content: string): SEOCheck {
    const plainText = content.replace(/<[^>]*>/g, '');
    const wordCount = plainText.split(/\s+/).length;

    if (wordCount < 300) {
      return {
        category: 'Critical',
        name: 'Content Length',
        status: 'fail',
        message: `Content is too short (${wordCount} words). Minimum: 300 words.`,
        impact: 'Thin content is penalized by search engines',
      };
    }
    if (wordCount < 600) {
      return {
        category: 'Critical',
        name: 'Content Length',
        status: 'warning',
        message: `Content is short (${wordCount} words). Recommended: 600+ words.`,
        impact: 'Longer content typically ranks better',
      };
    }
    return {
      category: 'Critical',
      name: 'Content Length',
      status: 'pass',
      message: `Content length is good (${wordCount} words)`,
      impact: 'Good for search rankings',
    };
  }

  private checkKeywords(keywords?: string[]): SEOCheck {
    if (!keywords || keywords.length === 0) {
      return {
        category: 'Important',
        name: 'Focus Keywords',
        status: 'warning',
        message: 'No focus keywords defined',
        impact: 'Missing keywords may reduce search visibility',
      };
    }
    if (keywords.length < 3) {
      return {
        category: 'Important',
        name: 'Focus Keywords',
        status: 'warning',
        message: `Only ${keywords.length} keyword(s). Recommended: 3-5 keywords.`,
        impact: 'More keywords = more search opportunities',
      };
    }
    if (keywords.length > 10) {
      return {
        category: 'Important',
        name: 'Focus Keywords',
        status: 'warning',
        message: `Too many keywords (${keywords.length}). Recommended: 3-5 focused keywords.`,
        impact: 'Keyword stuffing can harm rankings',
      };
    }
    return {
      category: 'Important',
      name: 'Focus Keywords',
      status: 'pass',
      message: `${keywords.length} focus keywords defined`,
      impact: 'Good keyword targeting',
    };
  }

  private checkHeadings(content: string): SEOCheck {
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;

    if (h1Count === 0 && h2Count === 0) {
      return {
        category: 'Important',
        name: 'Heading Structure',
        status: 'fail',
        message: 'No headings found in content',
        impact: 'Poor content structure affects readability and SEO',
      };
    }
    if (h1Count > 1) {
      return {
        category: 'Important',
        name: 'Heading Structure',
        status: 'warning',
        message: `Multiple H1 tags found (${h1Count}). Should have only one H1.`,
        impact: 'Multiple H1s can confuse search engines',
      };
    }
    if (h2Count < 2) {
      return {
        category: 'Important',
        name: 'Heading Structure',
        status: 'warning',
        message: 'Few H2 headings. Add more subheadings for better structure.',
        impact: 'Better heading structure improves readability and SEO',
      };
    }
    return {
      category: 'Important',
      name: 'Heading Structure',
      status: 'pass',
      message: `Good heading structure (${h2Count} H2 tags)`,
      impact: 'Good for content organization',
    };
  }

  private checkImages(content: string, featuredImage?: string): SEOCheck {
    const imageCount = (content.match(/<img[^>]*>/gi) || []).length;
    const imagesWithAlt = (content.match(/<img[^>]*alt\s*=\s*["'][^"']+["'][^>]*>/gi) || []).length;

    if (!featuredImage) {
      return {
        category: 'Important',
        name: 'Images & Alt Text',
        status: 'warning',
        message: 'No featured image set',
        impact: 'Featured images improve social sharing and click-through rates',
      };
    }

    if (imageCount === 0) {
      return {
        category: 'Important',
        name: 'Images & Alt Text',
        status: 'warning',
        message: 'No images in content',
        impact: 'Images improve engagement and SEO',
      };
    }

    if (imagesWithAlt < imageCount) {
      return {
        category: 'Important',
        name: 'Images & Alt Text',
        status: 'warning',
        message: `${imageCount - imagesWithAlt} images missing alt text`,
        impact: 'Missing alt text affects accessibility and image SEO',
      };
    }

    return {
      category: 'Important',
      name: 'Images & Alt Text',
      status: 'pass',
      message: `${imageCount} images with proper alt text`,
      impact: 'Good for accessibility and image search',
    };
  }

  private checkInternalLinks(content: string): SEOCheck {
    const internalLinkCount = (content.match(/href\s*=\s*["']\/[^"']*["']/gi) || []).length;

    if (internalLinkCount === 0) {
      return {
        category: 'Important',
        name: 'Internal Linking',
        status: 'warning',
        message: 'No internal links found',
        impact: 'Internal links help with site structure and SEO',
      };
    }
    if (internalLinkCount < 3) {
      return {
        category: 'Important',
        name: 'Internal Linking',
        status: 'warning',
        message: `Only ${internalLinkCount} internal link(s). Recommended: 3-5 links.`,
        impact: 'More internal links improve site navigation and SEO',
      };
    }
    return {
      category: 'Important',
      name: 'Internal Linking',
      status: 'pass',
      message: `${internalLinkCount} internal links found`,
      impact: 'Good for site structure',
    };
  }

  private checkExternalLinks(content: string): SEOCheck {
    const externalLinkCount = (content.match(/href\s*=\s*["']https?:\/\/[^"']*["']/gi) || []).length;
    const noFollowCount = (content.match(/rel\s*=\s*["'][^"']*nofollow[^"']*["']/gi) || []).length;

    if (externalLinkCount > 5 && noFollowCount === 0) {
      return {
        category: 'Optional',
        name: 'External Links',
        status: 'warning',
        message: `${externalLinkCount} external links without nofollow. Consider adding rel="nofollow" to some.`,
        impact: 'Too many dofollow external links can dilute page authority',
      };
    }
    return {
      category: 'Optional',
      name: 'External Links',
      status: 'pass',
      message: `${externalLinkCount} external links (${noFollowCount} nofollow)`,
      impact: 'Balanced external linking',
    };
  }

  private checkOpenGraph(ogTitle?: string, ogDescription?: string, ogImage?: string): SEOCheck {
    if (!ogTitle || !ogDescription || !ogImage) {
      return {
        category: 'Optional',
        name: 'Open Graph Tags',
        status: 'warning',
        message: 'Incomplete Open Graph tags (missing title, description, or image)',
        impact: 'Poor social media preview appearance',
      };
    }
    return {
      category: 'Optional',
      name: 'Open Graph Tags',
      status: 'pass',
      message: 'All Open Graph tags present',
      impact: 'Good for social sharing',
    };
  }

  private checkTwitterCard(twitterCard?: string): SEOCheck {
    if (!twitterCard) {
      return {
        category: 'Optional',
        name: 'Twitter Card',
        status: 'warning',
        message: 'Twitter Card not set',
        impact: 'Suboptimal Twitter preview',
      };
    }
    return {
      category: 'Optional',
      name: 'Twitter Card',
      status: 'pass',
      message: `Twitter Card type: ${twitterCard}`,
      impact: 'Good for Twitter sharing',
    };
  }

  private checkReadingTime(readingTime?: number): SEOCheck {
    if (!readingTime) {
      return {
        category: 'Optional',
        name: 'Reading Time',
        status: 'warning',
        message: 'Reading time not calculated',
        impact: 'Reading time improves user experience',
      };
    }
    return {
      category: 'Optional',
      name: 'Reading Time',
      status: 'pass',
      message: `Reading time: ${readingTime} minutes`,
      impact: 'Good for user experience',
    };
  }

  private checkCategories(categoryCount: number): SEOCheck {
    if (categoryCount === 0) {
      return {
        category: 'Optional',
        name: 'Categories',
        status: 'warning',
        message: 'No categories assigned',
        impact: 'Categories help with content organization',
      };
    }
    if (categoryCount > 3) {
      return {
        category: 'Optional',
        name: 'Categories',
        status: 'warning',
        message: `Too many categories (${categoryCount}). Recommended: 1-2 categories.`,
        impact: 'Too many categories can dilute topical relevance',
      };
    }
    return {
      category: 'Optional',
      name: 'Categories',
      status: 'pass',
      message: `${categoryCount} category/categories assigned`,
      impact: 'Good for content organization',
    };
  }

  private checkTags(tagCount: number): SEOCheck {
    if (tagCount === 0) {
      return {
        category: 'Optional',
        name: 'Tags',
        status: 'warning',
        message: 'No tags assigned',
        impact: 'Tags help with content discovery',
      };
    }
    if (tagCount > 10) {
      return {
        category: 'Optional',
        name: 'Tags',
        status: 'warning',
        message: `Too many tags (${tagCount}). Recommended: 3-7 tags.`,
        impact: 'Too many tags can appear spammy',
      };
    }
    return {
      category: 'Optional',
      name: 'Tags',
      status: 'pass',
      message: `${tagCount} tags assigned`,
      impact: 'Good for content discovery',
    };
  }

  private checkPublishDate(publishedAt?: Date): SEOCheck {
    if (!publishedAt) {
      return {
        category: 'Optional',
        name: 'Publish Date',
        status: 'warning',
        message: 'Post not published yet',
        impact: 'Draft posts are not indexed by search engines',
      };
    }

    const daysSincePublished = Math.floor(
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePublished > 365) {
      return {
        category: 'Optional',
        name: 'Content Freshness',
        status: 'warning',
        message: `Content is ${Math.floor(daysSincePublished / 365)} year(s) old. Consider updating.`,
        impact: 'Fresh content ranks better',
      };
    }

    return {
      category: 'Optional',
      name: 'Content Freshness',
      status: 'pass',
      message: `Published ${daysSincePublished} days ago`,
      impact: 'Content is relatively fresh',
    };
  }

  private generateRecommendations(checks: SEOCheck[]): string[] {
    const recommendations: string[] = [];
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warningChecks = checks.filter(c => c.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push('🚨 CRITICAL: Fix all failed checks immediately to improve SEO.');
      failedChecks.forEach(check => {
        recommendations.push(`   • ${check.name}: ${check.message}`);
      });
    }

    if (warningChecks.length > 0) {
      recommendations.push('⚠️ IMPROVEMENTS: Address these warnings to optimize SEO further.');
      warningChecks.slice(0, 5).forEach(check => {
        recommendations.push(`   • ${check.name}: ${check.message}`);
      });
    }

    if (failedChecks.length === 0 && warningChecks.length === 0) {
      recommendations.push('✅ Excellent! All SEO checks passed. Keep up the good work!');
      recommendations.push('💡 TIP: Continue monitoring and updating content regularly.');
    }

    return recommendations;
  }

  /**
   * Validate SEO title uniqueness
   */
  async validateUniqueSEOTitle(title: string, currentPostId?: string): Promise<{ isUnique: boolean; suggestion?: string }> {
    const existing = await this.prisma.post.findFirst({
      where: {
        OR: [
          { seoTitle: title },
          { title: title }, // Also check main title
        ],
        ...(currentPostId ? { id: { not: currentPostId } } : {}),
      },
      select: { id: true, title: true, seoTitle: true },
    });

    if (existing) {
      const year = new Date().getFullYear();
      return {
        isUnique: false,
        suggestion: `${title} - ${year}`,
      };
    }

    return { isUnique: true };
  }

  /**
   * Score title quality (0-100)
   */
  async scoreTitleQuality(title: string): Promise<{
    score: number;
    issues: string[];
    suggestions: string[];
    metrics: {
      length: number;
      keywordPresence: boolean;
      powerWords: number;
      emotionalImpact: 'low' | 'medium' | 'high';
      clickability: number;
    };
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const length = title.length;
    const powerWords = ['ultimate', 'complete', 'guide', 'best', 'top', 'essential', 'proven', 'expert', 'secret', 'amazing', 'incredible', 'powerful', 'effective', 'simple', 'easy', 'quick', 'fast', 'free', 'new', 'latest', '2024', '2025'];
    const emotionalWords = ['amazing', 'incredible', 'shocking', 'surprising', 'unbelievable', 'stunning', 'powerful', 'revolutionary', 'breakthrough', 'game-changing'];
    
    const titleLower = title.toLowerCase();
    const foundPowerWords = powerWords.filter(word => titleLower.includes(word)).length;
    const foundEmotionalWords = emotionalWords.filter(word => titleLower.includes(word)).length;

    // Length check
    if (length < 30) {
      score -= 30;
      issues.push(`Title too short (${length} chars). Minimum 30 characters recommended.`);
      suggestions.push('Add more descriptive words or include year/context');
    } else if (length > 60) {
      score -= 20;
      issues.push(`Title too long (${length} chars). May be truncated in search results.`);
      suggestions.push('Shorten to 50-60 characters for optimal display');
    } else if (length >= 50 && length <= 60) {
      score += 10; // Bonus for optimal length
    }

    // Power words check
    if (foundPowerWords === 0) {
      score -= 10;
      suggestions.push('Consider adding power words like "Complete", "Ultimate", or "Guide" to increase CTR');
    } else if (foundPowerWords >= 2) {
      score += 5;
    }

    // Emotional impact
    let emotionalImpact: 'low' | 'medium' | 'high' = 'low';
    if (foundEmotionalWords >= 2) {
      emotionalImpact = 'high';
      score += 10;
    } else if (foundEmotionalWords === 1) {
      emotionalImpact = 'medium';
      score += 5;
    } else {
      suggestions.push('Adding emotional words can increase click-through rates');
    }

    // Keyword presence (basic check - title should contain relevant keywords)
    const keywordPresence = length > 20; // Basic heuristic
    if (!keywordPresence) {
      score -= 15;
      issues.push('Title may lack relevant keywords');
    }

    // Clickability score (0-100)
    let clickability = 50; // Base score
    if (length >= 30 && length <= 60) clickability += 20;
    if (foundPowerWords > 0) clickability += 15;
    if (foundEmotionalWords > 0) clickability += 10;
    if (title.includes('?')) clickability += 5; // Questions can increase CTR
    if (title.includes(':')) clickability += 5; // Colons create curiosity
    clickability = Math.min(100, clickability);

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      issues,
      suggestions,
      metrics: {
        length,
        keywordPresence,
        powerWords: foundPowerWords,
        emotionalImpact,
        clickability,
      },
    };
  }
}
