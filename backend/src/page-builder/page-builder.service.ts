import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto, UpdatePageDto, CreateComponentDto, CreateTemplateDto, PageStatus, PageType } from './dto/page.dto';
import { SanitizationUtil } from '../common/utils/sanitization.util';
import { Prisma, PageStatus as DbPageStatus, PageType as DbPageType, Role } from '@prisma/client';
import { JsonValue } from '../common/types/json';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const isString = (value: unknown): value is string => typeof value === 'string';

const parseRoles = (roles?: string[]): Role[] | undefined => {
  if (!roles || roles.length === 0) return undefined;
  const roleValues = Object.values(Role);
  const parsed = roles.filter((role): role is Role => roleValues.includes(role as Role));
  return parsed.length > 0 ? parsed : undefined;
};

const parsePageStatusFilter = (status?: string): DbPageStatus | undefined => (
  status && Object.values(DbPageStatus).includes(status as DbPageStatus)
    ? (status as DbPageStatus)
    : undefined
);

const parsePageTypeFilter = (pageType?: string): DbPageType | undefined => (
  pageType && Object.values(DbPageType).includes(pageType as DbPageType)
    ? (pageType as DbPageType)
    : undefined
);

const mapPageStatus = (status?: PageStatus): DbPageStatus | undefined => (
  status ? (status as DbPageStatus) : undefined
);

const mapPageType = (pageType?: PageType): DbPageType | undefined => (
  pageType ? (pageType as DbPageType) : undefined
);

@Injectable()
export class PageBuilderService {
  private readonly logger = new Logger(PageBuilderService.name);
  
  constructor(private prisma: PrismaService) {}

  // ========== PAGE MANAGEMENT ==========

  async createPage(dto: CreatePageDto, authorId: string) {
    // Check if slug already exists
    const existing = await this.prisma.page.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Page with this slug already exists');
    }

    // SECURITY FIX (P2): Validate and sanitize custom CSS/JS
    if (dto.customJs) {
      // Warn about potential XSS - in production, consider disabling or using CSP
      this.logger.warn(`Custom JS detected for page: ${dto.slug}. This poses XSS risks.`);
      // Optionally block it entirely:
      // throw new BadRequestException('Custom JavaScript is disabled for security reasons');
    }
    
    if (dto.customCss && dto.customCss.includes('<script')) {
      throw new BadRequestException('CSS cannot contain script tags');
    }

    // Handle content - can be simple HTML string or page builder format
    let sanitizedContent: Prisma.InputJsonValue;
    if (typeof dto.content === 'string') {
      // Simple HTML content - store as string
      sanitizedContent = SanitizationUtil.sanitizeHTML(dto.content);
    } else if (dto.content && typeof dto.content === 'object') {
      // Page builder format - sanitize sections
      sanitizedContent = this.sanitizePageContent(dto.content) as Prisma.InputJsonValue;
    } else {
      // Default empty content
      sanitizedContent = dto.usePageBuilder ? {
        sections: [],
        globalStyles: {
          colors: { primary: '#3b82f6', secondary: '#64748b', accent: '#8b5cf6' },
          fonts: { heading: 'Inter', body: 'Inter' },
          spacing: { unit: 8 }
        }
      } : '';
    }

    // Destructure to exclude parentId from spreading
    const { parentId, allowedRoles, ...dtoWithoutRelations } = dto;
    const parsedRoles = parseRoles(allowedRoles);
    
    const page = await this.prisma.page.create({
      data: {
        ...dtoWithoutRelations,
        pageType: mapPageType(dto.pageType),
        status: mapPageStatus(dto.status),
        content: sanitizedContent,
        ...(parsedRoles && { allowedRoles: parsedRoles }),
        author: {
          connect: { id: authorId }
        },
        ...(parentId && {
          parent: { connect: { id: parentId } }
        })
      },
      include: {
        author: { select: { id: true, username: true, email: true } },
        versions: true,
        children: true,
      },
    });

    // Create initial version
    await this.createVersion(page.id, page.title, page.content, page.customCss, page.customJs, authorId, 'Initial version');

    return page;
  }

  async getAllPages(filters?: { 
    status?: string; 
    pageType?: string; 
    authorId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: Prisma.PageWhereInput = {};
    
    // Only apply status filter if explicitly provided (not 'ALL')
    if (filters?.status && filters.status !== 'ALL') {
      const parsedStatus = parsePageStatusFilter(filters.status);
      if (parsedStatus) {
        where.status = parsedStatus;
      }
    }
    
    // Only apply pageType filter if explicitly provided (not 'ALL')
    if (filters?.pageType && filters.pageType !== 'ALL') {
      const parsedPageType = parsePageTypeFilter(filters.pageType);
      if (parsedPageType) {
        where.pageType = parsedPageType;
      }
    }
    
    // Apply author filter if provided
    if (filters?.authorId) {
      where.authorId = filters.authorId;
    }

    // PERFORMANCE FIX: Add pagination (default 50 pages per request)
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;
    
    this.logger.log(`[PageBuilderService] getAllPages query: ${JSON.stringify(where)} (page ${page}, size ${pageSize})`);

    const [pages, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, email: true } },
          // PERFORMANCE FIX: Only include version count, not all version data
          _count: { select: { versions: true } },
          // PERFORMANCE FIX: Limit children to prevent deep hierarchy loads
          children: { take: 10, select: { id: true, title: true, slug: true } },
          parent: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.page.count({ where }),
    ]);

    this.logger.log(`[PageBuilderService] Found ${pages.length}/${total} pages in database`);
    return { pages, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getPageById(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, email: true } },
        versions: { orderBy: { versionNumber: 'desc' } },
        children: true,
        parent: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async getPageBySlug(slug: string) {
    const page = await this.prisma.page.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Increment view count
    await this.prisma.page.update({
      where: { id: page.id },
      data: { viewCount: { increment: 1 } },
    });

    return page;
  }

  async updatePage(id: string, dto: UpdatePageDto, userId: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check slug uniqueness if updating
    if (dto.slug && dto.slug !== page.slug) {
      const existing = await this.prisma.page.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Page with this slug already exists');
      }
    }

    // Destructure to exclude parentId from spreading
    const { parentId, allowedRoles, ...dtoWithoutRelations } = dto;
    
    // Sanitize content if provided
    if (dto.content) {
      if (typeof dto.content === 'string') {
        dtoWithoutRelations.content = SanitizationUtil.sanitizeHTML(dto.content);
      } else if (typeof dto.content === 'object') {
        dtoWithoutRelations.content = this.sanitizePageContent(dto.content);
      } else {
        dtoWithoutRelations.content = dto.content;
      }
    }
    
    // SECURITY: Validate custom CSS/JS (same as create)
    if (dto.customJs) {
      this.logger.warn(`Custom JS update detected for page: ${id}. This poses XSS risks.`);
    }
    if (dto.customCss && dto.customCss.includes('<script')) {
      throw new BadRequestException('CSS cannot contain script tags');
    }
    
    const updateData: Prisma.PageUpdateInput = {
      ...dtoWithoutRelations,
    };

    if (dto.pageType) {
      updateData.pageType = mapPageType(dto.pageType);
    }

    if (dto.status) {
      updateData.status = mapPageStatus(dto.status);
    }

    const parsedRoles = parseRoles(allowedRoles);
    if (parsedRoles) {
      updateData.allowedRoles = parsedRoles;
    }
      
      // Handle parent relation separately
      if (parentId !== undefined) {
        if (parentId) {
          updateData.parent = { connect: { id: parentId } };
        } else {
          updateData.parent = { disconnect: true };
        }
      }
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
    const updated = await this.prisma.page.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, username: true, email: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });

    // Create new version if content changed
    if (dto.content || dto.customCss || dto.customJs) {
      await this.createVersion(
        id,
        updated.title,
        updated.content,
        updated.customCss,
        updated.customJs,
        userId,
        'Content updated'
      );
    }

    return updated;
  }

  async deletePage(id: string) {
    const page = await this.prisma.page.findUnique({ where: { id } });
    
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.prisma.page.delete({ where: { id } });
    return { message: 'Page deleted successfully' };
  }

  async duplicatePage(id: string, authorId: string) {
    const original = await this.prisma.page.findUnique({ where: { id } });
    
    if (!original) {
      throw new NotFoundException('Page not found');
    }

    const newSlug = `${original.slug}-copy-${Date.now()}`;

    return this.prisma.page.create({
      data: {
        ...original,
        id: undefined,
        title: `${original.title} (Copy)`,
        slug: newSlug,
        status: 'DRAFT',
        authorId,
        publishedAt: null,
        createdAt: undefined,
        updatedAt: undefined,
      },
    });
  }

  // ========== VERSION CONTROL ==========

  private async createVersion(
    pageId: string,
    title: string,
    content: Prisma.InputJsonValue,
    customCss: string | null | undefined,
    customJs: string | null | undefined,
    userId: string,
    changeNote?: string
  ) {
    const lastVersion = await this.prisma.pageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;

    return this.prisma.pageVersion.create({
      data: {
        pageId,
        versionNumber,
        title,
        content,
        customCss,
        customJs,
        changeNote,
        createdById: userId,
      },
    });
  }

  async getPageVersions(pageId: string) {
    return this.prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async restoreVersion(pageId: string, versionNumber: number, userId: string) {
    const version = await this.prisma.pageVersion.findUnique({
      where: { pageId_versionNumber: { pageId, versionNumber } },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    const updated = await this.prisma.page.update({
      where: { id: pageId },
      data: {
        title: version.title,
        content: version.content,
        customCss: version.customCss,
        customJs: version.customJs,
      },
    });

    await this.createVersion(
      pageId,
      updated.title,
      updated.content,
      updated.customCss,
      updated.customJs,
      userId,
      `Restored from version ${versionNumber}`
    );

    return updated;
  }

  // ========== COMPONENT LIBRARY ==========

  async createComponent(dto: CreateComponentDto, userId: string) {
    return this.prisma.pageComponent.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });
  }

  async getAllComponents(filters?: { type?: string; category?: string; isGlobal?: boolean }) {
    const where: Prisma.PageComponentWhereInput = {};
    
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.isGlobal !== undefined) where.isGlobal = filters.isGlobal;

    return this.prisma.pageComponent.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });
  }

  async getComponentById(id: string) {
    const component = await this.prisma.pageComponent.findUnique({ where: { id } });
    
    if (!component) {
      throw new NotFoundException('Component not found');
    }

    return component;
  }

  async updateComponent(id: string, dto: Partial<CreateComponentDto>) {
    return this.prisma.pageComponent.update({
      where: { id },
      data: dto,
    });
  }

  async deleteComponent(id: string) {
    await this.prisma.pageComponent.delete({ where: { id } });
    return { message: 'Component deleted successfully' };
  }

  // ========== TEMPLATES ==========

  async createTemplate(dto: CreateTemplateDto) {
    // Check slug uniqueness
    const existing = await this.prisma.pageTemplate.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Template with this slug already exists');
    }

    return this.prisma.pageTemplate.create({ data: dto });
  }

  async getAllTemplates(filters?: { category?: string; isPremium?: boolean }) {
    const where: Prisma.PageTemplateWhereInput = { isActive: true };
    
    if (filters?.category) where.category = filters.category;
    if (filters?.isPremium !== undefined) where.isPremium = filters.isPremium;

    return this.prisma.pageTemplate.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.pageTemplate.findUnique({ where: { id } });
    
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Increment usage count
    await this.prisma.pageTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return template;
  }

  async createPageFromTemplate(templateId: string, title: string, slug: string, authorId: string) {
    const template = await this.getTemplateById(templateId);

    return this.createPage({
      title,
      slug,
      content: template.content,
      pageType: PageType.STATIC,
      status: PageStatus.DRAFT,
    }, authorId);
  }

  // ========== GLOBAL SECTIONS ==========

  async getGlobalSections() {
    return this.prisma.globalSection.findMany({
      where: { isActive: true },
      orderBy: { type: 'asc' },
    });
  }

  async updateGlobalSection(id: string, data: Prisma.GlobalSectionUpdateInput) {
    return this.prisma.globalSection.update({
      where: { id },
      data,
    });
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Recursively sanitize HTML content in page sections
   * Prevents XSS attacks via stored content
   */
  private sanitizePageContent(content: JsonValue): JsonValue {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      return content;
    }

    const contentRecord: Record<string, unknown> = { ...content };

    if (Array.isArray(contentRecord.sections)) {
      contentRecord.sections = contentRecord.sections.map((section) => {
        if (!isRecord(section)) {
          return section;
        }

        const sectionCopy: Record<string, unknown> = { ...section };
        const sectionContent = isRecord(sectionCopy.content) ? { ...sectionCopy.content } : undefined;

        if (sectionContent) {
          if (isString(sectionContent.text)) {
            sectionContent.text = SanitizationUtil.sanitizeHTML(sectionContent.text);
          }
          if (isString(sectionContent.leftColumn)) {
            sectionContent.leftColumn = SanitizationUtil.sanitizeHTML(sectionContent.leftColumn);
          }
          if (isString(sectionContent.rightColumn)) {
            sectionContent.rightColumn = SanitizationUtil.sanitizeHTML(sectionContent.rightColumn);
          }
          if (Array.isArray(sectionContent.columns)) {
            sectionContent.columns = sectionContent.columns.map((column) => {
              if (!isRecord(column)) {
                return column;
              }
              const columnCopy: Record<string, unknown> = { ...column };
              if (isString(columnCopy.content)) {
                columnCopy.content = SanitizationUtil.sanitizeHTML(columnCopy.content);
              }
              return columnCopy;
            });
          }

          sectionCopy.content = sectionContent;
        }

        return sectionCopy;
      });
    }

    return contentRecord as JsonValue;
  }
}
