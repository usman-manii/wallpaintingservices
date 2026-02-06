import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { PageBuilderService } from './page-builder.service';
import { CreatePageDto, UpdatePageDto, CreateComponentDto, CreateTemplateDto } from './dto/page.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { AuthenticatedRequest } from '../common/types';
import { Prisma } from '@prisma/client';

@Controller('pages')
export class PageBuilderController {
  private readonly logger = new Logger(PageBuilderController.name);
  
  constructor(private readonly pageBuilderService: PageBuilderService) {}

  // ========== PROTECTED ENDPOINTS ==========
  // NOTE: Specific routes must come BEFORE parameterized routes in NestJS
  // CRITICAL: @Get() with no path must come FIRST to match /pages exactly

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Get()
  async getAllPages(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('pageType') pageType?: string,
    @Query('authorId') authorId?: string,
  ) {
    this.logger.log('GET /pages endpoint called');
    this.logger.log('Request user:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
    
    // For AUTHOR role, only show their own pages unless explicitly filtering by another author
    let finalAuthorId = authorId;
    if (req.user && req.user.role === 'AUTHOR' && !authorId) {
      finalAuthorId = req.user.id;
    }
    
    // Normalize filter values - 'ALL' means no filter
    const normalizedStatus = status && status !== 'ALL' ? status : undefined;
    const normalizedPageType = pageType && pageType !== 'ALL' ? pageType : undefined;
    
    this.logger.log('Query params:', { 
      status: normalizedStatus, 
      pageType: normalizedPageType, 
      authorId: finalAuthorId, 
      userRole: req.user?.role,
      userId: req.user?.id || req.user?.userId
    });
    
    try {
      const pages = await this.pageBuilderService.getAllPages({ 
        status: normalizedStatus, 
        pageType: normalizedPageType, 
        authorId: finalAuthorId 
      });
      
      this.logger.log(` Returning ${pages.pages?.length || 0} pages from database`);
      
      // Return the full paginated response
      return pages;
    } catch (error) {
      this.logger.error('Error in getAllPages:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Post()
  async createPage(@Body() dto: CreatePageDto, @Request() req: AuthenticatedRequest) {
    return this.pageBuilderService.createPage(dto, req.user.userId);
  }

  // ========== PUBLIC ENDPOINTS ==========

  @Public()
  @Get('public')
  async getPublicPages() {
    return this.pageBuilderService.getAllPages({ status: 'PUBLISHED' });
  }

  @Public()
  @Get('slug/:slug')
  async getPageBySlug(@Param('slug') slug: string) {
    return this.pageBuilderService.getPageBySlug(slug);
  }

  @Public()
  @Get('id/:id')
  async getPageByIdPublic(@Param('id') id: string) {
    const page = await this.pageBuilderService.getPageById(id);
    // Only return published pages via public endpoint
    if (page.status !== 'PUBLISHED') {
      throw new NotFoundException('Page not found');
    }
    return page;
  }

  // ========== PROTECTED ENDPOINTS WITH PARAMETERS ==========
  // NOTE: Parameterized routes must come AFTER all specific routes

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Get(':id')
  async getPageById(@Param('id') id: string) {
    // Don't match if id is a reserved keyword that should use specific routes
    if (id === 'public' || id === 'list' || id === 'slug' || id === 'id') {
      throw new NotFoundException('Page not found');
    }
    return this.pageBuilderService.getPageById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Put(':id')
  async updatePage(
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pageBuilderService.updatePage(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Delete(':id')
  async deletePage(@Param('id') id: string) {
    return this.pageBuilderService.deletePage(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Post(':id/duplicate')
  async duplicatePage(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.pageBuilderService.duplicatePage(id, req.user.userId);
  }

  // ========== VERSION CONTROL ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Get(':id/versions')
  async getPageVersions(@Param('id') id: string) {
    return this.pageBuilderService.getPageVersions(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Post(':id/versions/:versionNumber/restore')
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pageBuilderService.restoreVersion(id, parseInt(versionNumber), req.user.userId);
  }

  // ========== COMPONENT LIBRARY ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('components')
  async createComponent(@Body() dto: CreateComponentDto, @Request() req: AuthenticatedRequest) {
    return this.pageBuilderService.createComponent(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('components')
  async getAllComponents(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('isGlobal') isGlobal?: string,
  ) {
    return this.pageBuilderService.getAllComponents({
      type,
      category,
      isGlobal: isGlobal === 'true',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Get('components/:id')
  async getComponentById(@Param('id') id: string) {
    return this.pageBuilderService.getComponentById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Put('components/:id')
  async updateComponent(@Param('id') id: string, @Body() dto: Partial<CreateComponentDto>) {
    return this.pageBuilderService.updateComponent(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Delete('components/:id')
  async deleteComponent(@Param('id') id: string) {
    return this.pageBuilderService.deleteComponent(id);
  }

  // ========== TEMPLATES ==========

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('templates')
  async createTemplate(@Body() dto: CreateTemplateDto) {
    return this.pageBuilderService.createTemplate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('templates')
  async getAllTemplates(
    @Query('category') category?: string,
    @Query('isPremium') isPremium?: string,
  ) {
    return this.pageBuilderService.getAllTemplates({
      category,
      isPremium: isPremium === 'true',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string) {
    return this.pageBuilderService.getTemplateById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('AUTHOR', 'EDITOR', 'ADMINISTRATOR', 'SUPER_ADMIN')
  @Post('templates/:id/create-page')
  async createPageFromTemplate(
    @Param('id') id: string,
    @Body() body: { title: string; slug: string },
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pageBuilderService.createPageFromTemplate(
      id,
      body.title,
      body.slug,
      req.user.userId
    );
  }

  // ========== GLOBAL SECTIONS ==========

  @UseGuards(JwtAuthGuard)
  @Get('global-sections')
  async getGlobalSections() {
    return this.pageBuilderService.getGlobalSections();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN')
  @Put('global-sections/:id')
  async updateGlobalSection(@Param('id') id: string, @Body() body: Prisma.GlobalSectionUpdateInput) {
    return this.pageBuilderService.updateGlobalSection(id, body);
  }
}


