// backend/src/blog/enhanced-blog.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PostStatus } from '@prisma/client';
import { SanitizationUtil } from '../common/utils/sanitization.util';

type UpdateEnhancedPostInput = Prisma.PostUpdateInput & {
  tagIds?: string[];
};

type TagUpdatePayload = {
  name?: string;
  slug?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  featured?: boolean;
  synonyms?: string[];
  linkedTagIds?: string[];
  locked?: boolean;
  forceUnlock?: boolean;
};

type TagSummary = {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const extractTagIdsFromTagsInput = (value: unknown): string[] | undefined => {
  if (!isRecord(value)) return undefined;

  const setValue = value.set;
  if (Array.isArray(setValue)) {
    const ids = setValue
      .filter(isRecord)
      .map((item) => (typeof item.id === 'string' ? item.id : undefined))
      .filter((id): id is string => Boolean(id));
    return ids.length > 0 ? ids : undefined;
  }

  const connectValue = value.connect;
  if (Array.isArray(connectValue)) {
    const ids = connectValue
      .filter(isRecord)
      .map((item) => (typeof item.id === 'string' ? item.id : undefined))
      .filter((id): id is string => Boolean(id));
    return ids.length > 0 ? ids : undefined;
  }

  return undefined;
};

@Injectable()
export class EnhancedBlogService {
  constructor(private prisma: PrismaService) {}

  // =========== AUTO-TAGGING SYSTEM ===========
  /**
   * Automatically generate tags from post content using keyword extraction
   * Extracts meaningful keywords and creates/assigns tags
   */
  async autoGenerateTags(content: string, title: string): Promise<string[]> {
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const titleWords = title.toLowerCase().split(/\s+/);
    
    // Common stop words to exclude
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an']);
    
    // Extract words (2+ characters)
    const words = plainText.match(/\b[a-z]{2,}\b/g) || [];
    
    // Count word frequency
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    // Boost title words
    titleWords.forEach(word => {
      if (frequency[word]) {
        frequency[word] *= 3; // 3x weight for title words
      }
    });
    
    // Sort by frequency and take top keywords
    const topKeywords = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    // Create/find tags for these keywords with synonym resolution
    const autoTags: string[] = [];
    for (const keyword of topKeywords) {
      const normalized = keyword.toLowerCase();
      const slug = normalized.replace(/\s+/g, '-');

      // Try match by slug/name first
      let tag = await this.prisma.tag.findFirst({
        where: {
          OR: [
            { slug },
            { name: { equals: keyword, mode: 'insensitive' } },
            { synonyms: { has: normalized } },
          ],
        },
      });

      if (tag) {
        // Increment usage and synonym hits if matched via synonym
        await this.prisma.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: { increment: 1 },
            synonymHits: tag.synonyms.includes(normalized) ? { increment: 1 } : undefined,
          },
        });
      } else {
        tag = await this.prisma.tag.create({
          data: {
            slug,
            name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            description: `Auto-generated tag for ${keyword}`,
            usageCount: 1,
          },
        });
      }

      autoTags.push(tag.id);
    }
    
    return autoTags;
  }

  // =========== AUTO-INTERLINKING SYSTEM ===========
  /**
   * Automatically creates internal links to related posts
   * Scans content for keywords matching other posts' titles/slugs
   */
  async autoGenerateInterlinks(postId: string, content: string, title: string) {
    // Find all published posts except current one
    const otherPosts = await this.prisma.post.findMany({
      where: {
        id: { not: postId },
        status: PostStatus.PUBLISHED,
      },
      select: { id: true, title: true, slug: true, seoKeywords: true },
    });
    
    const interlinks: Array<{ targetUrl: string; anchorText: string; context: string }> = [];
    
    // Create a map of keywords to posts
    for (const post of otherPosts) {
      // Check if post title appears in content (case-insensitive)
      const titlePattern = new RegExp(`\\b${post.title}\\b`, 'gi');
      const matches = content.match(titlePattern);
      
      if (matches && matches.length > 0) {
        // Find context around the match
        const contextMatch = content.match(new RegExp(`(.{50})${post.title}(.{50})`, 'i'));
        const context = contextMatch ? contextMatch[0] : '';
        
        interlinks.push({
          targetUrl: `/blog/${post.slug}`,
          anchorText: post.title,
          context,
        });
      }
      
      // Also check SEO keywords
      if (post.seoKeywords && post.seoKeywords.length > 0) {
        post.seoKeywords.forEach(keyword => {
          const keywordPattern = new RegExp(`\\b${keyword}\\b`, 'gi');
          if (keywordPattern.test(content)) {
            const contextMatch = content.match(new RegExp(`(.{30})${keyword}(.{30})`, 'i'));
            interlinks.push({
              targetUrl: `/blog/${post.slug}`,
              anchorText: keyword,
              context: contextMatch ? contextMatch[0] : '',
            });
          }
        });
      }
    }
    
    // Remove duplicates
    const uniqueInterlinks = interlinks.filter((link, index, self) =>
      index === self.findIndex((t) => t.targetUrl === link.targetUrl)
    );
    
    // Store internal links
    await this.prisma.internalLink.deleteMany({ where: { sourcePostId: postId } });
    
    for (const link of uniqueInterlinks.slice(0, 10)) { // Limit to 10 links
      await this.prisma.internalLink.create({
        data: {
          sourcePostId: postId,
          targetUrl: link.targetUrl,
          anchorText: link.anchorText,
          context: link.context,
          autoGenerated: true,
        },
      });
    }
    
    return uniqueInterlinks;
  }

  // =========== RELATED POSTS ALGORITHM ===========
  /**
   * Find related posts based on shared tags, categories, and content similarity
   */
  async findRelatedPosts(postId: string, limit: number = 5): Promise<string[]> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true, categories: true },
    });
    
    if (!post) return [];
    
    const tagIds = post.tags.map(t => t.id);
    const categoryIds = post.categories.map(c => c.id);
    
    // Find posts with overlapping tags/categories
    const relatedPosts = await this.prisma.post.findMany({
      where: {
        id: { not: postId },
        status: PostStatus.PUBLISHED,
        OR: [
          { tags: { some: { id: { in: tagIds } } } },
          { categories: { some: { id: { in: categoryIds } } } },
        ],
      },
      include: { tags: true, categories: true },
      take: limit * 2, // Get more than needed for scoring
    });
    
    // Score posts by relevance
    const scored = relatedPosts.map(relatedPost => {
      let score = 0;
      
      // Shared tags (higher weight)
      const sharedTags = relatedPost.tags.filter(t => tagIds.includes(t.id)).length;
      score += sharedTags * 3;
      
      // Shared categories
      const sharedCategories = relatedPost.categories.filter(c => categoryIds.includes(c.id)).length;
      score += sharedCategories * 2;
      
      // Recency bonus (newer posts get slight boost)
      const daysSincePublished = (Date.now() - new Date(relatedPost.publishedAt || relatedPost.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 10 - daysSincePublished / 30); // Boost for posts < 30 days old
      
      return { postId: relatedPost.id, score };
    });
    
    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.postId);
  }

  // =========== READING TIME CALCULATION ===========
  /**
   * Calculate estimated reading time in minutes
   */
  calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // =========== SEO AUTO-GENERATION ===========
  /**
   * Generate SEO metadata from content if not provided
   */
  async generateSEO(title: string, content: string, existingSEO?: { seoTitle?: string; seoDescription?: string; seoKeywords?: string[] }) {
    const plainText = content.replace(/<[^>]*>/g, ' ').trim();
    
    return {
      seoTitle: existingSEO?.seoTitle || title.substring(0, 60),
      seoDescription: existingSEO?.seoDescription || plainText.substring(0, 155) + '...',
      seoKeywords: existingSEO?.seoKeywords || await this.extractKeywords(title, plainText, 10),
      ogTitle: title.substring(0, 60),
      ogDescription: plainText.substring(0, 200) + '...',
    };
  }

  private async extractKeywords(title: string, content: string, limit: number): Promise<string[]> {
    const combined = `${title} ${content}`.toLowerCase();
    const words = combined.match(/\b[a-z]{4,}\b/g) || [];
    
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'more', 'will', 'about', 'which', 'when', 'where', 'their', 'there', 'these', 'those', 'what', 'your', 'into', 'than', 'them', 'then', 'some', 'would', 'could', 'other']);
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([word]) => word);
  }

  // =========== CREATE POST WITH AUTO-FEATURES ===========
  /**
   * Create a post with automatic tag generation, interlinking, and SEO
   */
  async createEnhancedPost(data: {
    title: string;
    content: string;
    excerpt?: string;
    slug: string;
    authorId: string;
    status?: PostStatus;
    featuredImage?: string;
    categoryIds?: string[];
    tagIds?: string[];
    scheduledFor?: Date;
    aiGenerated?: boolean;
  }) {
    const sanitizedTitle = SanitizationUtil.sanitizeText(data.title);
    const sanitizedContent = SanitizationUtil.sanitizeHTML(data.content);
    const sanitizedExcerpt = data.excerpt ? SanitizationUtil.sanitizeText(data.excerpt) : undefined;
    const sanitizedSlug = SanitizationUtil.sanitizeSlug(data.slug);

    // Generate auto-tags from content
    const autoTagIds = await this.autoGenerateTags(sanitizedContent, sanitizedTitle);
    
    // Merge manual tags with auto-generated ones
    let allTagIds = [...new Set([...(data.tagIds || []), ...autoTagIds])];
    allTagIds = await this.expandLinkedTags(allTagIds);
    
    // Calculate reading time
    const readingTime = this.calculateReadingTime(sanitizedContent);
    
    // Generate SEO metadata
    const seoData = await this.generateSEO(sanitizedTitle, sanitizedContent);
    
    // Extract excerpt if not provided
    const plainText = sanitizedContent.replace(/<[^>]*>/g, ' ').trim();
    const excerpt = sanitizedExcerpt || plainText.substring(0, 160) + '...';
    
    // Determine published date
    const now = new Date();
    const publishedAt = data.status === PostStatus.PUBLISHED ? now : null;
    
    // Create post
    const post = await this.prisma.post.create({
      data: {
        title: sanitizedTitle,
        slug: sanitizedSlug,
        content: sanitizedContent,
        excerpt,
        featuredImage: data.featuredImage,
        status: data.status || PostStatus.DRAFT,
        publishedAt,
        scheduledFor: data.scheduledFor,
        readingTime,
        aiGenerated: data.aiGenerated || false,
        autoTags: autoTagIds,
        ...seoData,
        author: { connect: { id: data.authorId } },
        categories: data.categoryIds ? { connect: data.categoryIds.map(id => ({ id })) } : undefined,
        tags: allTagIds.length > 0 ? { connect: allTagIds.map(id => ({ id })) } : undefined,
      },
      include: { tags: true, categories: true, author: true },
    });
    
    // Generate interlinks (async, don't wait)
    this.autoGenerateInterlinks(post.id, sanitizedContent, sanitizedTitle);
    
    // Find and store related posts
    const relatedPostIds = await this.findRelatedPosts(post.id);
    await this.prisma.post.update({
      where: { id: post.id },
      data: { relatedPostIds },
    });
    
    return post;
  }

  // =========== UPDATE POST WITH AUTO-FEATURES ===========
  async updateEnhancedPost(id: string, data: UpdateEnhancedPostInput) {
    const existingPost = await this.prisma.post.findUnique({ where: { id }, include: { tags: true } });
    
    if (!existingPost) {
      throw new Error('Post not found');
    }

    const { tagIds, ...updateData } = data;
    const hasContent = typeof updateData.content === 'string';
    const hasTitle = typeof updateData.title === 'string';

    // If content or title changed, regenerate auto-features
    if (hasContent || hasTitle) {
      const content = hasContent
        ? SanitizationUtil.sanitizeHTML(updateData.content as string)
        : existingPost.content;
      const title = hasTitle
        ? SanitizationUtil.sanitizeText(updateData.title as string)
        : existingPost.title;

      // Regenerate auto-tags
      const autoTagIds = await this.autoGenerateTags(content, title);

      // Recalculate reading time
      const readingTime = this.calculateReadingTime(content);

      // Regenerate interlinks
      await this.autoGenerateInterlinks(id, content, title);

      // Update related posts
      const relatedPostIds = await this.findRelatedPosts(id);

      const manualTagIds = Array.isArray(tagIds)
        ? tagIds
        : extractTagIdsFromTagsInput(updateData.tags) ?? existingPost.tags.map(tag => tag.id);
      let allTagIds = await this.expandLinkedTags(manualTagIds);

      updateData.content = content;
      updateData.title = title;
      updateData.autoTags = autoTagIds;
      updateData.readingTime = readingTime;
      updateData.relatedPostIds = relatedPostIds;
      updateData.tags = allTagIds.length > 0 ? { set: allTagIds.map(tagId => ({ id: tagId })) } : undefined;
    }

    if (typeof updateData.excerpt === 'string') {
      updateData.excerpt = SanitizationUtil.sanitizeText(updateData.excerpt);
    }

    if (typeof updateData.slug === 'string') {
      updateData.slug = SanitizationUtil.sanitizeSlug(updateData.slug);
    }

    return this.prisma.post.update({
      where: { id },
      data: updateData,
      include: { tags: true, categories: true, author: true },
    });
  }

  // =========== SCHEDULED PUBLISHING ===========
  /**
   * Process scheduled posts and publish them
   */
  async processScheduledPosts() {
    const now = new Date();
    
    const scheduledPosts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledFor: { lte: now },
      },
    });
    
    for (const post of scheduledPosts) {
      await this.prisma.post.update({
        where: { id: post.id },
        data: {
          status: PostStatus.PUBLISHED,
          publishedAt: now,
        },
      });
    }
    
    return scheduledPosts.length;
  }

  // =========== TRENDING TAGS ===========
  /**
   * Update trending tags based on recent usage
   */
  async updateTrendingTags() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get tags used in posts from last 30 days
    const recentPosts = await this.prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { gte: thirtyDaysAgo },
      },
      include: { tags: true },
    });
    
    // Count tag usage
    const tagUsage: { [id: string]: number } = {};
    recentPosts.forEach(post => {
      post.tags.forEach(tag => {
        tagUsage[tag.id] = (tagUsage[tag.id] || 0) + 1;
      });
    });
    
    // Get top 10 trending tags
    const trendingTagIds = Object.entries(tagUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);
    
    // Update all tags
    await this.prisma.tag.updateMany({
      where: {},
      data: { trending: false },
    });
    
    // Mark trending tags
    await this.prisma.tag.updateMany({
      where: { id: { in: trendingTagIds } },
      data: { trending: true },
    });
    
    return trendingTagIds.length;
  }

  /**
   * Get scheduled posts
   */
  async getScheduledPosts() {
    return this.prisma.post.findMany({
      where: {
        OR: [
          {
            status: PostStatus.SCHEDULED,
            scheduledFor: { not: null },
          },
          {
            status: PostStatus.DRAFT,
            scheduledFor: { not: null },
          },
        ],
      },
      include: {
        author: { select: { username: true, displayName: true } },
        categories: true,
        tags: true,
      },
      orderBy: { scheduledFor: 'asc' },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(postId: string) {
    return this.prisma.post.update({
      where: { id: postId },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  /**
   * Get trending tags (public)
   */
  async getTrendingTags() {
    return this.prisma.tag.findMany({
      where: { trending: true },
      orderBy: { usageCount: 'desc' },
      take: 10,
    });
  }

  /**
   * Expand tag list with linked companion tags
   */
  private async expandLinkedTags(tagIds: string[]): Promise<string[]> {
    if (!tagIds || tagIds.length === 0) return [];
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, linkedTagIds: true },
    });

    const expanded = new Set<string>(tagIds);
    tags.forEach(t => {
      (t.linkedTagIds || []).forEach(linked => expanded.add(linked));
    });
    return Array.from(expanded);
  }

  /**
   * Public list of categories for sitemap/navigation
   */
  async getPublicCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
        createdAt: true,
        featured: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Public list of tags (lightweight)
   */
  async getPublicTags() {
    return this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true,
        createdAt: true,
        trending: true,
        featured: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all tags (admin)
   */
  async getAllTags(options: { skip?: number; take?: number } = {}) {
    return this.prisma.tag.findMany({
      include: {
        parent: true,
        children: true,
        posts: { select: { id: true } },
      },
      orderBy: { usageCount: 'desc' },
      skip: options.skip || 0,
      take: options.take || 50,
    });
  }

  /**
   * Create tag
   */
  async createTag(data: {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
    featured?: boolean;
    synonyms?: string[];
    linkedTagIds?: string[];
    locked?: boolean;
  }) {
    const name = data.name.trim();
    const slug = this.slugify(data.slug || data.name);

    // Prevent duplicates by slug or name (case-insensitive)
    const existing = await this.prisma.tag.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: name, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) {
      throw new Error('Tag with the same name or slug already exists');
    }

    return this.prisma.tag.create({
      data: {
        name,
        slug,
        description: data.description,
        color: data.color || '#3b82f6',
        icon: data.icon,
        featured: data.featured ?? false,
        synonyms: (data.synonyms || []).map(s => s.trim().toLowerCase()).filter(s => s.length > 0),
        linkedTagIds: Array.from(new Set((data.linkedTagIds || []).filter(id => !!id))),
        locked: data.locked ?? false,
        parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Update tag
   */
  async updateTag(id: string, data: TagUpdatePayload) {
    const updateData: Prisma.TagUpdateInput = {};

    // Protect locked tags
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Tag not found');
    }
    if (existing.locked && !data.forceUnlock) {
      throw new Error('Tag is locked and cannot be modified');
    }

    const nameValue = typeof data.name === 'string' ? data.name.trim() : undefined;
    if (nameValue) {
      updateData.name = nameValue;
    }

    if (Array.isArray(data.synonyms)) {
      updateData.synonyms = data.synonyms
        .map((s: string) => s.trim().toLowerCase())
        .filter((s: string) => s.length > 0);
    }

    if (Array.isArray(data.linkedTagIds)) {
      updateData.linkedTagIds = Array.from(new Set(data.linkedTagIds.filter((v: string) => !!v)));
    }

    if (typeof data.description === 'string' || data.description === null) {
      updateData.description = data.description;
    }

    if (typeof data.color === 'string' || data.color === null) {
      updateData.color = data.color;
    }

    if (typeof data.icon === 'string' || data.icon === null) {
      updateData.icon = data.icon;
    }

    if (typeof data.featured === 'boolean') {
      updateData.featured = data.featured;
    }

    if (typeof data.locked === 'boolean') {
      updateData.locked = data.locked;
    }

    const slugValue = data.slug || nameValue ? this.slugify(data.slug || nameValue || '') : undefined;
    if (slugValue) {
      updateData.slug = slugValue;
    }

    // Prevent self-parenting
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new Error('A tag cannot be its own parent');
      }
      if (data.parentId && await this.wouldCreateTagCycle(id, data.parentId)) {
        throw new Error('Tag hierarchy cycle detected');
      }
      updateData.parent = data.parentId
        ? { connect: { id: data.parentId } }
        : { disconnect: true };
    }

    // Prevent duplicates when changing name/slug
    if (slugValue || nameValue) {
      const orConditions: Prisma.TagWhereInput[] = [];
      if (slugValue) {
        orConditions.push({ slug: slugValue });
      }
      if (nameValue) {
        orConditions.push({ name: { equals: nameValue, mode: 'insensitive' } });
      }

      const existing = await this.prisma.tag.findFirst({
        where: {
          id: { not: id },
          OR: orConditions,
        },
      });
      if (existing) {
        throw new Error('Another tag with the same name or slug already exists');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Delete tag
   */
  async deleteTag(id: string) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Tag not found');
    }
    if (existing.locked) {
      throw new Error('Tag is locked and cannot be deleted');
    }

    // First disconnect all posts
    await this.prisma.tag.update({
      where: { id },
      data: {
        posts: { set: [] },
      },
    });
    
    // Then delete the tag
    return this.prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * Merge multiple tags into one target tag
   */
  async mergeTags(sourceIds: string[], targetId: string) {
    // Get all posts with source tags
    const sourceTags = await this.prisma.tag.findMany({
      where: { id: { in: sourceIds } },
      include: { posts: true },
    });
    
    // Get target tag
    const targetTag = await this.prisma.tag.findUnique({
      where: { id: targetId },
      include: { posts: true },
    });
    
    if (!targetTag) {
      throw new Error('Target tag not found');
    }
    
    // Collect all unique post IDs
    const allPostIds = new Set<string>();
    sourceTags.forEach(tag => {
      tag.posts.forEach(post => allPostIds.add(post.id));
    });
    targetTag.posts.forEach(post => allPostIds.add(post.id));
    
    // Connect target tag to all posts
    await this.prisma.tag.update({
      where: { id: targetId },
      data: {
        posts: {
          set: Array.from(allPostIds).map(id => ({ id })),
        },
        usageCount: allPostIds.size,
        mergeCount: { increment: sourceIds.length },
      },
    });
    
    // Delete source tags
    await this.prisma.tag.deleteMany({
      where: { id: { in: sourceIds } },
    });
    
    return this.prisma.tag.findUnique({
      where: { id: targetId },
      include: { posts: true },
    });
  }

  async bulkSetParent(tagIds: string[], parentId: string | null) {
    const targets = await this.prisma.tag.findMany({ where: { id: { in: tagIds } } });
    const allowedIds: string[] = [];
    for (const tag of targets) {
      if (tag.locked || tag.id === parentId) continue;
      if (parentId && await this.wouldCreateTagCycle(tag.id, parentId)) {
        continue;
      }
      allowedIds.push(tag.id);
    }
    if (allowedIds.length === 0) return { updated: 0 };
    const result = await this.prisma.tag.updateMany({
      where: { id: { in: allowedIds } },
      data: { parentId: parentId || null },
    });
    return { updated: result.count };
  }

  private async wouldCreateTagCycle(tagId: string, parentId: string | null): Promise<boolean> {
    if (!parentId) return false;
    let current = parentId;
    const visited = new Set<string>();
    while (current) {
      if (current === tagId) return true;
      if (visited.has(current)) return true;
      visited.add(current);
      const parent = await this.prisma.tag.findUnique({
        where: { id: current },
        select: { parentId: true },
      });
      current = parent?.parentId ?? null;
    }
    return false;
  }

  async bulkUpdateStyle(tagIds: string[], data: { color?: string; icon?: string; featured?: boolean }) {
    const targets = await this.prisma.tag.findMany({ where: { id: { in: tagIds } } });
    const allowedIds = targets.filter(t => !t.locked).map(t => t.id);
    if (allowedIds.length === 0) return { updated: 0 };
    const result = await this.prisma.tag.updateMany({
      where: { id: { in: allowedIds } },
      data,
    });
    return { updated: result.count };
  }

  async bulkLock(tagIds: string[], locked: boolean) {
    const result = await this.prisma.tag.updateMany({
      where: { id: { in: tagIds } },
      data: { locked },
    });
    return { updated: result.count };
  }

  /**
   * Convert tags into categories while keeping existing tag links
   */
  async convertTagsToCategories(tagIds: string[]) {
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      include: { posts: { select: { id: true } } },
    });

    const results: Array<{ tagId: string; categoryId: string }> = [];

    for (const tag of tags) {
      // Ensure category exists
      let category = await this.prisma.category.findFirst({
        where: {
          OR: [
            { slug: tag.slug },
            { name: { equals: tag.name, mode: 'insensitive' } },
          ],
        },
      });

      if (!category) {
        category = await this.prisma.category.create({
          data: {
            name: tag.name,
            slug: tag.slug,
            description: tag.description,
            color: tag.color,
            icon: tag.icon,
            featured: tag.featured,
          },
        });
      }

      // Connect category to posts that had the tag
      if (tag.posts.length > 0) {
        for (const post of tag.posts) {
          await this.prisma.post.update({
            where: { id: post.id },
            data: {
              categories: { connect: { id: category.id } },
            },
          });
        }
      }

      results.push({ tagId: tag.id, categoryId: category.id });
    }

    return results;
  }

  /**
   * Detect potential duplicate tags by name similarity
   */
  async findDuplicateTags(threshold: number = 0.28) {
    const tags: TagSummary[] = await this.prisma.tag.findMany({
      select: { id: true, name: true, slug: true, usageCount: true },
    });

    const duplicates: Array<{ a: TagSummary; b: TagSummary; score: number }> = [];

    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const a = tags[i];
        const b = tags[j];
        const score = this.stringDistance(a.name, b.name);
        if (score >= threshold) {
          duplicates.push({ a, b, score: Number(score.toFixed(2)) });
        }
      }
    }

    return duplicates
      .sort((x, y) => y.score - x.score)
      .slice(0, 50);
  }

  /**
   * Normalized similarity (1 - normalized Levenshtein)
   */
  private stringDistance(a: string, b: string): number {
    const s = a.toLowerCase();
    const t = b.toLowerCase();
    if (s === t) return 1;
    const len = Math.max(s.length, t.length);
    const dist = this.levenshtein(s, t);
    return 1 - dist / len;
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
