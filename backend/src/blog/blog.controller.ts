
import { Controller, Get, Post, Body, Param, Delete, Put, Patch, UseGuards, Query, Request, NotFoundException, Header, BadRequestException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { EnhancedBlogService } from './enhanced-blog.service';
import { SEOAuditService } from './seo-audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { SanitizationUtil } from '../common/utils/sanitization.util';
import { AuthenticatedRequest } from '../common/types';
import { Prisma, PostStatus } from '@prisma/client';

type CreateEnhancedPostPayload = {
  title: string;
  content: string;
  slug: string;
  excerpt?: string;
  status?: PostStatus;
  featuredImage?: string;
  categoryIds?: string[];
  tagIds?: string[];
  scheduledFor?: Date;
};

type TagCreatePayload = {
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

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseStringArray = (value: unknown): string[] | undefined => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
);

const parseDate = (value: unknown): Date | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
};

const parsePostStatus = (value: unknown): PostStatus | undefined => {
  if (value === PostStatus.DRAFT || value === PostStatus.PUBLISHED || value === PostStatus.SCHEDULED || value === PostStatus.ARCHIVED) {
    return value;
  }
  return undefined;
};

const parseCreateEnhancedPostPayload = (value: unknown): CreateEnhancedPostPayload => {
  if (!isRecord(value)) {
    throw new BadRequestException('Invalid post payload');
  }

  const title = typeof value.title === 'string' ? value.title : '';
  const content = typeof value.content === 'string' ? value.content : '';
  const slug = typeof value.slug === 'string' ? value.slug : '';

  if (!title || !content || !slug) {
    throw new BadRequestException('Missing required post fields');
  }

  return {
    title,
    content,
    slug,
    excerpt: typeof value.excerpt === 'string' ? value.excerpt : undefined,
    status: parsePostStatus(value.status),
    featuredImage: typeof value.featuredImage === 'string' ? value.featuredImage : undefined,
    categoryIds: parseStringArray(value.categoryIds),
    tagIds: parseStringArray(value.tagIds),
    scheduledFor: parseDate(value.scheduledFor),
  };
};

const parseTagCreatePayload = (value: unknown): TagCreatePayload => {
  if (!isRecord(value)) {
    throw new BadRequestException('Invalid tag payload');
  }

  const name = typeof value.name === 'string' ? value.name : '';
  if (!name) {
    throw new BadRequestException('Tag name is required');
  }

  return {
    name,
    slug: typeof value.slug === 'string' ? value.slug : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
    color: typeof value.color === 'string' ? value.color : undefined,
    icon: typeof value.icon === 'string' ? value.icon : undefined,
    parentId: typeof value.parentId === 'string' ? value.parentId : undefined,
    featured: typeof value.featured === 'boolean' ? value.featured : undefined,
    synonyms: parseStringArray(value.synonyms),
    linkedTagIds: parseStringArray(value.linkedTagIds),
    locked: typeof value.locked === 'boolean' ? value.locked : undefined,
  };
};

const parseTagUpdatePayload = (value: unknown): TagUpdatePayload => {
  if (!isRecord(value)) {
    throw new BadRequestException('Invalid tag payload');
  }

  const parseNullableString = (input: unknown): string | null | undefined => {
    if (typeof input === 'string') return input;
    if (input === null) return null;
    return undefined;
  };

  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    slug: typeof value.slug === 'string' ? value.slug : undefined,
    description: parseNullableString(value.description),
    color: parseNullableString(value.color),
    icon: parseNullableString(value.icon),
    parentId: parseNullableString(value.parentId),
    featured: typeof value.featured === 'boolean' ? value.featured : undefined,
    synonyms: parseStringArray(value.synonyms),
    linkedTagIds: parseStringArray(value.linkedTagIds),
    locked: typeof value.locked === 'boolean' ? value.locked : undefined,
    forceUnlock: typeof value.forceUnlock === 'boolean' ? value.forceUnlock : undefined,
  };
};

@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly enhancedBlogService: EnhancedBlogService,
    private readonly seoAuditService: SEOAuditService,
  ) {}

  // Public: Read All
  @Public()
  @Get()
  async findAll(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.blogService.findAll({
        take: Number(take) || 10,
        skip: Number(skip) || 0,
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' }
    });
  }

  // Public: Categories (for sitemap/navigation)
  @Public()
  @Get('categories')
  async listCategories() {
    return this.enhancedBlogService.getPublicCategories();
  }

  // Public: Tags
  @Public()
  @Get('tags')
  async listTags() {
    return this.enhancedBlogService.getPublicTags();
  }

  // Public: RSS Feed
  @Public()
  @Get('rss')
  @Header('Content-Type', 'application/rss+xml; charset=utf-8')
  async getRss() {
      const posts = await this.blogService.findAll({
        take: 20,
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
      });

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const escapeXml = (value: string) =>
        value.replace(/[<>&'"]/g, (c) => {
          switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
          }
        });

      const xml = `<?xml version="1.0" encoding="UTF-8" ?>
      <rss version="2.0">
      <channel>
        <title>${escapeXml('AI SEO Blog')}</title>
        <link>${escapeXml(baseUrl)}</link>
        <description>${escapeXml('The latest updates from our AI Blog')}</description>
        ${posts.map((post) => {
          const title = SanitizationUtil.sanitizeText(post.title || '');
          const description = SanitizationUtil.sanitizeText(post.seoDescription || post.excerpt || 'Read more...');
          return `
            <item>
                <title>${escapeXml(title)}</title>
                <link>${escapeXml(`${baseUrl}/blog/${post.slug}`)}</link>
                <description>${escapeXml(description)}</description>
                <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
            </item>
          `;
        }).join('')}
      </channel>
      </rss>`;
      
      return xml;
  }

  // Public: Read One (with view count increment)
  @Public()
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const post = await this.blogService.findOne(slug);
    
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    
    // Increment view count
    if (post) {
      await this.enhancedBlogService.incrementViewCount(post.id);
    }
    
    return post;
  }

  // Admin: Create Manual Post (human-written with auto-features)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('manual')
  async createManualPost(@Body() postData: unknown, @Request() req: AuthenticatedRequest) {
    const payload = parseCreateEnhancedPostPayload(postData);
    return this.enhancedBlogService.createEnhancedPost({
      ...payload,
      authorId: req.user.id,
      aiGenerated: false, // Manual post
    });
  }

  // Admin: Create (original endpoint, kept for compatibility)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post()
  async create(@Body() postData: unknown) {
    const payload = isRecord(postData) ? postData : {};
    return this.blogService.createPost(payload as Prisma.PostCreateInput);
  }

  // Admin: Update (with auto-feature regeneration)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Put(':id')
  async update(@Param('id') id: string, @Body() postData: unknown) {
    const payload = isRecord(postData) ? postData : {};
    // Extract categoryIds and tagIds if present
    const { categoryIds, tagIds, ...updateData } = payload;
    
    // Build the update object with proper relations
    const data: Prisma.PostUpdateInput = { ...updateData } as Prisma.PostUpdateInput;
    const parsedCategoryIds = parseStringArray(categoryIds);
    const parsedTagIds = parseStringArray(tagIds);
    
    // Handle categories connection
    if (parsedCategoryIds) {
      data.categories = {
        set: parsedCategoryIds.map((categoryId) => ({ id: categoryId }))
      };
    }
    
    // Handle tags connection
    if (parsedTagIds) {
      data.tags = {
        set: parsedTagIds.map((tagId) => ({ id: tagId }))
      };
    }
    
    // Use enhanced service if content or title changed
    if (typeof data.content === 'string' || typeof data.title === 'string') {
      return this.enhancedBlogService.updateEnhancedPost(id, { ...data, tagIds: parsedTagIds });
    }
    
    return this.blogService.updatePost({
      where: { id },
      data,
    });
  }

  // Admin: Get single post by ID (for edit screen)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR')
  @Get('admin/posts/:id')
  async getAdminPostById(@Param('id') id: string) {
    const post = await this.blogService.findById(id);
    if (!post) {
      // Ensure we never return an empty 200 with no body
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  // Admin: Delete
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.blogService.deletePost({ id });
  }

  // Admin: Get all posts (with filters)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR')
  @Get('admin/posts')
  async getAllPosts(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const where: Prisma.PostWhereInput = {};
    
    // For AUTHOR role, only show their own posts unless explicitly filtering by another author
    if (req.user && req.user.role === 'AUTHOR' && !authorId) {
      where.authorId = req.user.id;
    }
    
    if (status && status !== 'all') {
      const parsedStatus = parsePostStatus(status);
      if (parsedStatus) {
        where.status = parsedStatus;
      }
    }
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    const order = orderBy === 'oldest' ? 'asc' : 'desc';
    
    // Parse take parameter, default to 1000 for admin panel to show all posts
    const takeValue = take ? parseInt(take, 10) : 1000;
    const skipValue = skip ? parseInt(skip, 10) : 0;
    
    return this.blogService.findAll({
      take: isNaN(takeValue) ? 1000 : takeValue,
      skip: isNaN(skipValue) ? 0 : skipValue,
      where,
      orderBy: { createdAt: order },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
        categories: true,
        tags: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
  }

  // Admin: Get scheduled posts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin/scheduled')
  async getScheduledPosts() {
    return this.enhancedBlogService.getScheduledPosts();
  }

  // Admin: Process scheduled posts (can be called manually or by cron)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('admin/process-scheduled')
  async processScheduledPosts() {
    return this.enhancedBlogService.processScheduledPosts();
  }

  // Admin: Get related posts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin/:id/related')
  async getRelatedPosts(@Param('id') id: string) {
    return this.enhancedBlogService.findRelatedPosts(id);
  }

  // Public: Get related posts (for end-user display)
  @Public()
  @Get(':id/related')
  async getPublicRelatedPosts(@Param('id') id: string) {
    return this.enhancedBlogService.findRelatedPosts(id, 5);
  }

  // Admin: Update trending tags
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('admin/update-trending')
  async updateTrendingTags() {
    return this.enhancedBlogService.updateTrendingTags();
  }

  // Public: Get trending tags
  @Public()
  @Get('tags/trending')
  async getTrendingTags() {
    return this.enhancedBlogService.getTrendingTags();
  }

  // Admin: Tag Management Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin/tags')
  async getAllTags(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.enhancedBlogService.getAllTags({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 50,
    });
  }

  // Duplicate tag suggestions
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin/tags/duplicates')
  async getDuplicateTags() {
    return this.enhancedBlogService.findDuplicateTags();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/tags')
  async createTag(@Body() data: unknown) {
    const payload = parseTagCreatePayload(data);
    return this.enhancedBlogService.createTag(payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Put('admin/tags/:id')
  async updateTag(@Param('id') id: string, @Body() data: unknown) {
    const payload = parseTagUpdatePayload(data);
    return this.enhancedBlogService.updateTag(id, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Delete('admin/tags/:id')
  async deleteTag(@Param('id') id: string) {
    return this.enhancedBlogService.deleteTag(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('admin/tags/merge')
  async mergeTags(@Body() data: { sourceIds: string[]; targetId: string }) {
    return this.enhancedBlogService.mergeTags(data.sourceIds, data.targetId);
  }

  // Bulk set parent
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/tags/bulk/parent')
  async bulkParent(@Body() data: { ids: string[]; parentId?: string | null }) {
    return this.enhancedBlogService.bulkSetParent(data.ids, data.parentId || null);
  }

  // Bulk style update
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/tags/bulk/style')
  async bulkStyle(@Body() data: { ids: string[]; color?: string; icon?: string; featured?: boolean }) {
    return this.enhancedBlogService.bulkUpdateStyle(data.ids, {
      color: data.color,
      icon: data.icon,
      featured: data.featured,
    });
  }

  // Lock/unlock tags
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('admin/tags/lock')
  async lockTags(@Body() data: { ids: string[]; locked: boolean }) {
    return this.enhancedBlogService.bulkLock(data.ids, data.locked);
  }

  // Convert tags to categories
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('admin/tags/convert-to-category')
  async convertTags(@Body() data: { ids: string[] }) {
    return this.enhancedBlogService.convertTagsToCategories(data.ids);
  }

  // SEO Audit Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('admin/seo/audit/:postId')
  async auditPost(@Param('postId') postId: string) {
    return this.seoAuditService.auditPost(postId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('admin/seo/audit-site')
  async auditSite() {
    return this.seoAuditService.auditSite();
  }

  // Title Validation & Quality Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/seo/validate-title')
  async validateSEOTitle(
    @Body() dto: { title: string; postId?: string },
  ): Promise<{ isUnique: boolean; suggestion?: string }> {
    return this.seoAuditService.validateUniqueSEOTitle(dto.title, dto.postId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/seo/score-title')
  async scoreTitleQuality(
    @Body() dto: { title: string },
  ) {
    return this.seoAuditService.scoreTitleQuality(dto.title);
  }
}
