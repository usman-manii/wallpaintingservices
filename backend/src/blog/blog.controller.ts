
import { Controller, Get, Post, Body, Param, Delete, Put, Patch, UseGuards, Query, Request, NotFoundException, Header } from '@nestjs/common';
import { BlogService } from './blog.service';
import { EnhancedBlogService } from './enhanced-blog.service';
import { SEOAuditService } from './seo-audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { SanitizationUtil } from '../common/utils/sanitization.util';

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
        ${posts.map((p: any) => {
          const title = SanitizationUtil.sanitizeText(p.title || '');
          const description = SanitizationUtil.sanitizeText(p.seoDescription || p.excerpt || 'Read more...');
          return `
            <item>
                <title>${escapeXml(title)}</title>
                <link>${escapeXml(`${baseUrl}/blog/${p.slug}`)}</link>
                <description>${escapeXml(description)}</description>
                <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
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
  async createManualPost(@Body() postData: any, @Request() req: any) {
    return this.enhancedBlogService.createEnhancedPost({
      ...postData,
      authorId: req.user.id,
      aiGenerated: false, // Manual post
    });
  }

  // Admin: Create (original endpoint, kept for compatibility)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post()
  async create(@Body() postData: any) {
    return this.blogService.createPost(postData);
  }

  // Admin: Update (with auto-feature regeneration)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Put(':id')
  async update(@Param('id') id: string, @Body() postData: any) {
    // Extract categoryIds and tagIds if present
    const { categoryIds, tagIds, ...updateData } = postData;
    
    // Build the update object with proper relations
    const data: any = { ...updateData };
    
    // Handle categories connection
    if (categoryIds !== undefined) {
      data.categories = {
        set: categoryIds.map((id: string) => ({ id }))
      };
    }
    
    // Handle tags connection
    if (tagIds !== undefined) {
      data.tags = {
        set: tagIds.map((id: string) => ({ id }))
      };
    }
    
    // Use enhanced service if content or title changed
    if (data.content || data.title) {
      return this.enhancedBlogService.updateEnhancedPost(id, data);
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
    @Request() req: any,
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const where: any = {};
    
    // For AUTHOR role, only show their own posts unless explicitly filtering by another author
    if (req.user && req.user.role === 'AUTHOR' && !authorId) {
      where.authorId = req.user.id;
    }
    
    if (status && status !== 'all') {
      where.status = status;
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Post('admin/tags')
  async createTag(@Body() data: { name: string; slug: string; description?: string; color?: string; icon?: string; parentId?: string }) {
    return this.enhancedBlogService.createTag(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Put('admin/tags/:id')
  async updateTag(@Param('id') id: string, @Body() data: any) {
    return this.enhancedBlogService.updateTag(id, data);
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
