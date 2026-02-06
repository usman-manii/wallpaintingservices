import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsObject, IsDateString, ValidateIf } from 'class-validator';
import { JsonValue } from '../../common/types/json';

export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  ARCHIVED = 'ARCHIVED',
}

export enum PageType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
  TEMPLATE = 'TEMPLATE',
  HOMEPAGE = 'HOMEPAGE',
  LANDING = 'LANDING',
}

export class CreatePageDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PageType)
  @IsOptional()
  pageType?: PageType;

  @IsEnum(PageStatus)
  @IsOptional()
  status?: PageStatus;

  @IsBoolean()
  @IsOptional()
  usePageBuilder?: boolean;

  @IsBoolean()
  @IsOptional()
  isPolicyPage?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && typeof value === 'object')
  @IsObject()
  @ValidateIf((_, value) => typeof value === 'string')
  @IsString()
  content?: JsonValue;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsString()
  customJs?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsString()
  headerType?: string;

  @IsOptional()
  @IsString()
  footerType?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsObject()
  metaTags?: JsonValue;

  @IsOptional()
  @IsObject()
  mobileContent?: JsonValue;

  @IsOptional()
  @IsObject()
  tabletContent?: JsonValue;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @IsOptional()
  @IsArray()
  allowedRoles?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateCategory?: string;

  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSharing?: boolean;
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PageType)
  pageType?: PageType;

  @IsOptional()
  @IsEnum(PageStatus)
  status?: PageStatus;

  @IsOptional()
  @IsBoolean()
  usePageBuilder?: boolean;

  @IsOptional()
  @IsBoolean()
  isPolicyPage?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== null && typeof value === 'object')
  @IsObject()
  @ValidateIf((_, value) => typeof value === 'string')
  @IsString()
  content?: JsonValue;

  @IsOptional()
  @IsString()
  customCss?: string;

  @IsOptional()
  @IsString()
  customJs?: string;

  @IsOptional()
  @IsString()
  layout?: string;

  @IsOptional()
  @IsString()
  headerType?: string;

  @IsOptional()
  @IsString()
  footerType?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  seoKeywords?: string[];

  @IsOptional()
  @IsString()
  ogImage?: string;

  @IsOptional()
  @IsObject()
  metaTags?: JsonValue;

  @IsOptional()
  @IsObject()
  mobileContent?: JsonValue;

  @IsOptional()
  @IsObject()
  tabletContent?: JsonValue;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @IsOptional()
  @IsArray()
  allowedRoles?: string[];

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  templateCategory?: string;

  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSharing?: boolean;
}

export class CreateComponentDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  category: string;

  @IsObject()
  content: JsonValue;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  preview?: string;

  @IsObject()
  content: JsonValue;

  @IsString()
  category: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
