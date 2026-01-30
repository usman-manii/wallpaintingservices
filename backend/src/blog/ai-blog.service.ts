import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { PostStatus } from '@prisma/client';

export interface GenerationResult {
  success: boolean;
  postId?: string;
  title?: string;
  error?: string;
  wordCount?: number;
}

@Injectable()
export class AiBlogService {
  private readonly logger = new Logger(AiBlogService.name);
  private readonly MIN_WORD_COUNT = 3000;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * MAIN AI GENERATION WORKFLOW
   * Generates multiple blog posts based on site configuration
   */
  async generateBlogBatch(keywords?: string[], count?: number): Promise<GenerationResult[]> {
    this.logger.log('🤖 Starting AI blog batch generation...');

    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings?.aiEnabled) {
      this.logger.warn('AI generation is disabled in settings');
      return [];
    }

    const batchSize = count || settings.aiBatchSize || 10;
    const targetKeywords = keywords || settings.siteKeywords || [];
    
    this.logger.log(`📝 Generating ${batchSize} posts with keywords: ${targetKeywords.join(', ')}`);

    const results: GenerationResult[] = [];

    for (let i = 0; i < batchSize; i++) {
      try {
        const result = await this.generateSinglePost(targetKeywords, settings);
        results.push(result);
        
        // Small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.logger.error(`Failed to generate post ${i + 1}: ${error.message}`);
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`✅ Batch complete: ${successCount}/${batchSize} posts generated successfully`);

    return results;
  }

  /**
   * Generate a single blog post with AI
   */
  private async generateSinglePost(keywords: string[], settings: any): Promise<GenerationResult> {
    // Get AI system user or create one
    const aiUser = await this.getOrCreateAiUser();

    // Build comprehensive prompt
    const prompt = this.buildPrompt(keywords, settings);

    // Update post status to generating
    const post = await this.prisma.post.create({
      data: {
        title: 'Generating...',
        content: '',
        slug: `generating-${Date.now()}`,
        status: PostStatus.AI_GENERATING,
        aiGenerated: true,
        aiModel: settings.aiModel || 'gpt-4',
        aiPrompt: prompt,
        authorId: aiUser.id,
        generationAttempts: 1,
      },
    });

    try {
      // Call AI service to generate content
      const aiResult = await this.aiService.generateBlogPost(prompt, {
        minWords: settings.aiMinWordCount || this.MIN_WORD_COUNT,
        maxWords: settings.aiMaxWordCount || 5000,
        tone: settings.contentTone || 'professional',
        keywords: keywords,
      });

      // Validate word count
      const wordCount = this.countWords(aiResult.content);
      if (wordCount < this.MIN_WORD_COUNT) {
        throw new Error(`Generated content too short: ${wordCount} words (minimum ${this.MIN_WORD_COUNT})`);
      }

      // Generate slug from title
      const slug = await this.generateUniqueSlug(aiResult.title);

      // Auto-generate tags if AI didn't provide them
      const autoTags = await this.extractTagsFromContent(
        aiResult.title,
        aiResult.content,
        aiResult.metaDescription,
      );

      // Update post with AI-generated content
      const updatedPost = await this.prisma.post.update({
        where: { id: post.id },
        data: {
          title: aiResult.title,
          content: aiResult.content,
          excerpt: aiResult.excerpt || aiResult.metaDescription,
          slug: slug,
          seoTitle: aiResult.seoTitle || aiResult.title,
          seoDescription: aiResult.metaDescription,
          seoKeywords: aiResult.keywords || keywords,
          wordCount: wordCount,
          readingTime: Math.ceil(wordCount / 200), // Avg 200 words per minute
          autoTags: autoTags,
          status: settings.aiAutoApprove ? PostStatus.APPROVED_DRAFT : PostStatus.AI_REVIEW,
          lastGeneratedAt: new Date(),
          aiMetadata: {
            generatedAt: new Date(),
            model: settings.aiModel,
            prompt: prompt,
            keywords: keywords,
            version: '1.0',
          },
        },
      });

      // Create tags and link them
      await this.createAndLinkTags(updatedPost.id, autoTags);

      this.logger.log(`✅ Generated: "${updatedPost.title}" (${wordCount} words, ${autoTags.length} tags)`);

      return {
        success: true,
        postId: updatedPost.id,
        title: updatedPost.title,
        wordCount: wordCount,
      };

    } catch (error) {
      // Mark post as failed and keep in draft for manual review
      await this.prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.DRAFT,
          reviewNotes: `AI generation failed: ${error.message}`,
        },
      });

      this.logger.error(`❌ Generation failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build comprehensive prompt for AI
   */
  private buildPrompt(keywords: string[], settings: any): string {
    const keywordsList = keywords.slice(0, 5).join(', ');
    
    return `You are an expert content writer for a ${settings.contentFocus || 'wall painting services'} website.

TARGET AUDIENCE: ${settings.targetAudience || 'Homeowners and businesses seeking professional painting services'}
TONE: ${settings.contentTone || 'professional, informative, and engaging'}
KEYWORDS: ${keywordsList}

Write a comprehensive, SEO-optimized blog post (minimum ${settings.aiMinWordCount || 3000} words) that:

1. TITLE: Create an engaging, keyword-rich title (60-70 characters)
2. STRUCTURE:
   - Introduction (2-3 paragraphs)
   - 5-7 main sections with H2 headings
   - Each section should have 3-5 paragraphs with H3 subheadings
   - Include bullet points and numbered lists where appropriate
   - Conclusion with clear call-to-action

3. CONTENT REQUIREMENTS:
   - Natural keyword integration (don't stuff)
   - Practical examples and actionable advice
   - Address common questions and concerns
   - Include statistics or data points when relevant
   - Write in an authoritative but accessible style

4. SEO ELEMENTS:
   - Meta description (150-160 characters)
   - 5-10 relevant keywords
   - Suggest 5-8 tags

5. FORMAT: Return as JSON with this structure:
{
  "title": "Blog post title",
  "content": "Full HTML content with proper headings, paragraphs, lists",
  "excerpt": "Brief summary for preview",
  "metaDescription": "SEO meta description",
  "seoTitle": "SEO-optimized title",
  "keywords": ["keyword1", "keyword2", ...],
  "tags": ["tag1", "tag2", ...]
}

Focus on providing genuine value to readers while naturally incorporating these keywords: ${keywordsList}`;
  }

  /**
   * Extract relevant tags from content using smart analysis
   */
  async extractTagsFromContent(title: string, content: string, description: string): Promise<string[]> {
    const text = `${title} ${description} ${content}`.toLowerCase();
    
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    
    // Common painting service keywords
    const paintingKeywords = [
      'painting', 'paint', 'wall', 'interior', 'exterior', 'residential', 'commercial',
      'dubai', 'abu dhabi', 'sharjah', 'uae', 'villa', 'apartment', 'office',
      'color', 'texture', 'finish', 'coating', 'primer', 'professional', 'service',
      'renovation', 'remodeling', 'maintenance', 'quality', 'premium', 'affordable',
      'waterproof', 'weather resistant', 'eco-friendly', 'quick-drying', 'decorative',
    ];

    const foundTags: Set<string> = new Set();

    // Extract keywords found in content
    for (const keyword of paintingKeywords) {
      const regex = new RegExp(`\\b${keyword}[s]?\\b`, 'gi');
      if (regex.test(cleanText)) {
        foundTags.add(this.capitalizeFirst(keyword));
      }
    }

    // Extract location tags
    const locations = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'UAE', 'Northern Emirates', 'Fujairah', 'RAK'];
    locations.forEach(loc => {
      if (cleanText.includes(loc.toLowerCase())) {
        foundTags.add(loc);
      }
    });

    // Extract service types
    const services = ['Interior Painting', 'Exterior Painting', 'Commercial Painting', 'Residential Painting'];
    services.forEach(service => {
      if (cleanText.includes(service.toLowerCase())) {
        foundTags.add(service);
      }
    });

    const tags = Array.from(foundTags);
    
    // Ensure minimum tags
    if (tags.length < 3) {
      tags.push('Wall Painting', 'Professional Services', 'UAE');
    }

    return tags.slice(0, 10); // Max 10 tags
  }

  /**
   * Create tags and link them to post
   */
  private async createAndLinkTags(postId: string, tagNames: string[]): Promise<void> {
    const settings = await this.prisma.siteSettings.findFirst();
    const maxTags = settings?.maxTagsPerPost || 10;
    
    const limitedTags = tagNames.slice(0, maxTags);

    for (const tagName of limitedTags) {
      const slug = this.slugify(tagName);

      // Find or create tag
      const tag = await this.prisma.tag.upsert({
        where: { slug },
        create: {
          name: tagName,
          slug: slug,
          usageCount: 1,
        },
        update: {
          usageCount: { increment: 1 },
        },
      });

      // Link tag to post
      await this.prisma.post.update({
        where: { id: postId },
        data: {
          tags: {
            connect: { id: tag.id },
          },
        },
      });
    }
  }

  /**
   * AUTO-INTERLINKING SYSTEM
   * Analyzes all posts and creates intelligent internal links
   */
  async performAutoInterlinking(): Promise<number> {
    this.logger.log('🔗 Starting auto-interlinking process...');

    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings?.autoInterlinkEnabled) {
      this.logger.warn('Auto-interlinking is disabled');
      return 0;
    }

    // Get all published posts
    const posts = await this.prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        tags: { select: { name: true } },
        categories: { select: { name: true } },
      },
    });

    let totalLinksCreated = 0;

    for (const sourcePost of posts) {
      // Find related posts by tags and categories
      const relatedPosts = posts.filter(p => 
        p.id !== sourcePost.id && (
          p.tags.some(t => sourcePost.tags.some(st => st.name === t.name)) ||
          p.categories.some(c => sourcePost.categories.some(sc => sc.name === c.name))
        )
      );

      // Delete existing auto-generated links
      await this.prisma.internalLink.deleteMany({
        where: {
          sourcePostId: sourcePost.id,
          autoGenerated: true,
        },
      });

      // Create new internal links
      const minLinks = settings.minInterlinksPerPost || 3;
      const maxLinks = settings.maxInterlinksPerPost || 8;
      const targetLinks = Math.min(relatedPosts.length, maxLinks);

      for (let i = 0; i < Math.min(targetLinks, relatedPosts.length); i++) {
        const targetPost = relatedPosts[i];
        
        try {
          await this.prisma.internalLink.create({
            data: {
              sourcePostId: sourcePost.id,
              targetUrl: `/blog/${targetPost.slug}`,
              anchorText: targetPost.title,
              context: this.extractContext(sourcePost.content, targetPost.title),
              autoGenerated: true,
            },
          });

          totalLinksCreated++;
        } catch (error) {
          this.logger.warn(`Failed to create link from ${sourcePost.slug} to ${targetPost.slug}`);
        }
      }
    }

    this.logger.log(`✅ Auto-interlinking complete: ${totalLinksCreated} links created`);
    return totalLinksCreated;
  }

  /**
   * CONTENT REFRESH SYSTEM
   * Identifies old posts and queues them for AI refresh
   */
  async identifyPostsNeedingRefresh(): Promise<number> {
    this.logger.log('🔄 Checking for posts needing refresh...');

    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings?.contentRefreshEnabled) {
      this.logger.warn('Content refresh is disabled');
      return 0;
    }

    const refreshAfterDays = settings.refreshAfterDays || 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - refreshAfterDays);

    // Find old published posts
    const oldPosts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        OR: [
          { lastRefreshedAt: { lt: cutoffDate } },
          { lastRefreshedAt: null, publishedAt: { lt: cutoffDate } },
        ],
        needsRefresh: false,
      },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        lastRefreshedAt: true,
      },
    });

    // Mark posts for refresh
    for (const post of oldPosts) {
      await this.prisma.post.update({
        where: { id: post.id },
        data: {
          needsRefresh: true,
          refreshReason: `Content is over ${refreshAfterDays} days old`,
          contentAge: Math.floor(
            (Date.now() - (post.lastRefreshedAt || post.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      });
    }

    this.logger.log(`📋 Marked ${oldPosts.length} posts for content refresh`);
    return oldPosts.length;
  }

  /**
   * Refresh old content with new AI-generated updates
   */
  async refreshOldContent(postId: string): Promise<GenerationResult> {
    this.logger.log(`🔄 Refreshing content for post: ${postId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true, categories: true },
    });

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    const settings = await this.prisma.siteSettings.findFirst();

    // Build refresh prompt
    const refreshPrompt = `Update and modernize this existing blog post with latest trends and information:

ORIGINAL TITLE: ${post.title}
ORIGINAL CONTENT: ${post.content.substring(0, 500)}...
EXISTING TAGS: ${post.tags.map(t => t.name).join(', ')}

Requirements:
1. Keep the same general topic but update with:
   - Latest industry trends and statistics
   - Current best practices
   - New technologies or methods
   - Updated examples and case studies

2. Maintain or exceed ${settings.aiMinWordCount || 3000} words
3. Preserve existing URL structure and SEO optimization
4. Make content more engaging and valuable
5. Add new keywords while keeping existing ones

Return updated content in the same JSON format.`;

    try {
      const aiResult = await this.aiService.generateBlogPost(refreshPrompt, {
        minWords: settings.aiMinWordCount || this.MIN_WORD_COUNT,
        maxWords: settings.aiMaxWordCount || 5000,
        tone: settings.contentTone || 'professional',
      });

      const wordCount = this.countWords(aiResult.content);

      await this.prisma.post.update({
        where: { id: postId },
        data: {
          content: aiResult.content,
          excerpt: aiResult.excerpt || aiResult.metaDescription,
          seoDescription: aiResult.metaDescription,
          seoKeywords: aiResult.keywords,
          wordCount: wordCount,
          readingTime: Math.ceil(wordCount / 200),
          lastRefreshedAt: new Date(),
          needsRefresh: false,
          refreshReason: null,
          contentAge: 0,
        },
      });

      this.logger.log(`✅ Content refreshed: "${post.title}" (${wordCount} words)`);

      return { success: true, postId: postId, title: post.title, wordCount: wordCount };
    } catch (error) {
      this.logger.error(`❌ Refresh failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * AUTO-TAG HUMAN WRITTEN POSTS
   * Intelligently extract tags from manually created posts
   */
  async autoTagHumanPost(postId: string): Promise<string[]> {
    this.logger.log(`🏷️ Auto-tagging post: ${postId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post || post.aiGenerated) {
      return [];
    }

    // Extract tags from title, content, and metadata
    const autoTags = await this.extractTagsFromContent(
      post.title,
      post.content,
      post.seoDescription || post.excerpt || '',
    );

    // Update post with auto-generated tags
    await this.prisma.post.update({
      where: { id: postId },
      data: { autoTags: autoTags },
    });

    // Create and link tags
    await this.createAndLinkTags(postId, autoTags);

    this.logger.log(`✅ Auto-tagged with ${autoTags.length} tags: ${autoTags.join(', ')}`);

    return autoTags;
  }

  /**
   * Validate blog post meets minimum requirements
   */
  async validatePostRequirements(postId: string): Promise<{ valid: boolean; errors: string[] }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true },
    });

    const errors: string[] = [];

    if (!post) {
      return { valid: false, errors: ['Post not found'] };
    }

    // Check word count
    const wordCount = this.countWords(post.content);
    if (wordCount < this.MIN_WORD_COUNT) {
      errors.push(`Content too short: ${wordCount} words (minimum ${this.MIN_WORD_COUNT})`);
    }

    // Check tags
    const settings = await this.prisma.siteSettings.findFirst();
    const minTags = settings?.minTagsPerPost || 3;
    if (post.tags.length < minTags) {
      errors.push(`Not enough tags: ${post.tags.length} (minimum ${minTags})`);
    }

    // Check SEO fields
    if (!post.seoTitle || post.seoTitle.length < 30) {
      errors.push('SEO title missing or too short');
    }

    if (!post.seoDescription || post.seoDescription.length < 120) {
      errors.push('SEO description missing or too short');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get statistics for admin dashboard
   */
  async getAiStatistics() {
    const [
      totalPosts,
      aiPosts,
      postsInReview,
      postsNeedingRefresh,
      recentGenerations,
    ] = await Promise.all([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { aiGenerated: true } }),
      this.prisma.post.count({ where: { status: PostStatus.AI_REVIEW } }),
      this.prisma.post.count({ where: { needsRefresh: true } }),
      this.prisma.post.count({
        where: {
          lastGeneratedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalPosts,
      aiPosts,
      humanPosts: totalPosts - aiPosts,
      aiPercentage: totalPosts > 0 ? ((aiPosts / totalPosts) * 100).toFixed(1) : 0,
      postsInReview,
      postsNeedingRefresh,
      recentGenerations,
    };
  }

  // Utility methods

  private async getOrCreateAiUser() {
    let user = await this.prisma.user.findFirst({
      where: { username: 'ai-editor' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          username: 'ai-editor',
          email: 'ai@system.internal',
          password: 'AI_SYSTEM_NO_LOGIN',
          displayName: 'AI Content Generator',
          role: 'AUTHOR',
        },
      });
    }

    return user;
  }

  private countWords(text: string): number {
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleanText.split(' ').filter(word => word.length > 0).length;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let slug = this.slugify(title);
    let counter = 1;

    while (true) {
      const existing = await this.prisma.post.findUnique({
        where: { slug: counter > 1 ? `${slug}-${counter}` : slug },
      });

      if (!existing) {
        return counter > 1 ? `${slug}-${counter}` : slug;
      }

      counter++;
    }
  }

  private capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }


  // =========== INTERLINKING ANALYTICS ===========
  async getInterlinkingStats() {
    const totalLinks = await this.prisma.internalLink.count();
    const autoGenerated = await this.prisma.internalLink.count({ where: { autoGenerated: true } });
    const manual = await this.prisma.internalLink.count({ where: { autoGenerated: false } });
    
    // Get unique source posts count by grouping
    const postsWithLinks = await this.prisma.internalLink.findMany({
      distinct: ['sourcePostId'],
      select: { sourcePostId: true }
    });
    
    const settings = await this.prisma.siteSettings.findFirst();
    const publishedPosts = await this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } });
    
    return {
      totalLinks,
      autoGenerated,
      manual,
      postsWithLinks: postsWithLinks.length,
      avgLinksPerPost: postsWithLinks.length > 0 ? (totalLinks / postsWithLinks.length).toFixed(1) : 0,
      publishedPosts,
      settings: {
        enabled: settings?.autoInterlinkEnabled ?? false,
        minLinks: settings?.minInterlinksPerPost ?? 3,
        maxLinks: settings?.maxInterlinksPerPost ?? 8
      }
    };
  }

  async getInternalLinks(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [links, total] = await this.prisma.$transaction([
      this.prisma.internalLink.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sourcePost: { select: { title: true, slug: true } },
        }
      }),
      this.prisma.internalLink.count(),
    ]);

    return {
      links,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  private extractContext(content: string, anchorText: string): string {
    const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const index = cleanContent.toLowerCase().indexOf(anchorText.toLowerCase());
    
    if (index === -1) {
      return cleanContent.substring(0, 150);
    }

    const start = Math.max(0, index - 75);
    const end = Math.min(cleanContent.length, index + anchorText.length + 75);
    return cleanContent.substring(start, end).trim();
  }
}
