// src/settings/settings.service.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SiteSettings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadVerificationFileDto } from './dto/verification-file.dto';
import { JsonValue } from '../common/types/json';

type SettingsUpdate = Partial<Omit<SiteSettings, 'id' | 'updatedAt'>>;

type VerificationFileEntry = {
  filename: string;
  content: string;
  description?: string;
  uploadedAt: string;
  size: number;
};

type VerificationFileMap = Record<string, VerificationFileEntry>;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseString = (value: unknown, fallback = ''): string => (
  typeof value === 'string' ? value : fallback
);

const parseNumber = (value: unknown, fallback = 0): number => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  
  // PERFORMANCE FIX: In-memory cache for settings (5 minute TTL)
  private settingsCache: SiteSettings | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    // PERFORMANCE FIX: Return cached settings if still valid
    const now = Date.now();
    if (this.settingsCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.settingsCache;
    }
    
    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings) {
      // Create default if not exists
      const newSettings = await this.prisma.siteSettings.create({
        data: {
          siteName: 'My AI Blog',
          description: 'A futuristic blog powered by AI',
        },
      });
      this.settingsCache = newSettings;
      this.cacheTimestamp = now;
      return newSettings;
    }
    
    // Update cache
    this.settingsCache = settings;
    this.cacheTimestamp = now;
    return settings;
  }

  async updateSettings(data: SettingsUpdate) {
    try {
      const start = await this.getSettings(); // ensure one exists
      
      // Clean up the data - remove undefined values and handle nulls properly
      // Also filter out unknown fields that don't exist in the Prisma schema
      const cleanData: SettingsUpdate = {};
      const cleanDataRecord = cleanData as Record<string, unknown>;
      const validFields = new Set<keyof SettingsUpdate>([
        'siteName', 'description', 'footerText', 'seoKeywords', 'socialLinks', 'aiConfig',
        'logo', 'favicon', 'darkMode', 'captchaType', 'recaptchaV2SiteKey', 'recaptchaV2SecretKey',
        'recaptchaV3SiteKey', 'recaptchaV3SecretKey', 'recaptchaSiteKey', 'recaptchaSecretKey',
        'forceHttps', 'homePageLayout', 'homePageId', 'blogPageId', 'topBarEnabled',
        'contactInfo', 'menuStructure', 'widgetConfig', 'appearanceSettings',
        'googleSiteVerification', 'bingSiteVerification', 'yandexSiteVerification',
        'pinterestVerification', 'facebookDomainVerification', 'customVerificationTag',
        'verificationFiles', 'aiEnabled', 'aiProvider', 'aiModel', 'aiBatchSize',
        'aiMinWordCount', 'aiMaxWordCount', 'aiAutoApprove', 'aiGenerationSchedule',
        'siteKeywords', 'targetAudience', 'contentTone', 'contentFocus',
        'autoTaggingEnabled', 'minTagsPerPost', 'maxTagsPerPost',
        'autoInterlinkEnabled', 'minInterlinksPerPost', 'maxInterlinksPerPost', 'interlinkingSchedule',
        'contentRefreshEnabled', 'refreshAfterDays', 'refreshCheckSchedule'
        , 'cookieConsentEnabled', 'cookieConsentConfig', 'notificationConfig',
        'aiMode', 'aiLearningLevel', 'aiSelfLearningEnabled',
        'sitemapConfig'
      ]);
      
      (Object.keys(data) as Array<keyof SettingsUpdate>).forEach((key) => {
        const value = data[key];
        // Only include defined values (null is allowed, undefined is not)
        // And only include fields that exist in the schema
        if (value !== undefined && validFields.has(key)) {
          cleanDataRecord[key as string] = value as SettingsUpdate[keyof SettingsUpdate];
        }
      });
      
      const updated = await this.prisma.siteSettings.update({
        where: { id: start.id },
        data: cleanData,
      });
      
      // PERFORMANCE FIX: Invalidate cache when settings are updated
      this.settingsCache = updated;
      this.cacheTimestamp = Date.now();
      
      return updated;
    } catch (error: unknown) {
      // Log the actual error for debugging using NestJS Logger
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error updating settings: ${message}`, stack);
      throw new BadRequestException(
        message || 'Failed to update settings. Please check the data format.'
      );
    }
  }

  async getPublicSettings() {
    const settings = await this.getSettings();
    return {
      siteName: settings.siteName,
      description: settings.description,
      footerText: settings.footerText,
      seoKeywords: settings.seoKeywords,
      socialLinks: settings.socialLinks,
      logo: settings.logo,
      favicon: settings.favicon,
      darkMode: settings.darkMode,
      captchaType: settings.captchaType,
      recaptchaV2SiteKey: settings.recaptchaV2SiteKey,
      recaptchaV3SiteKey: settings.recaptchaV3SiteKey,
      recaptchaSiteKey: settings.recaptchaSiteKey,
      homePageLayout: settings.homePageLayout,
      homePageId: settings.homePageId,
      blogPageId: settings.blogPageId,
      googleSiteVerification: settings.googleSiteVerification,
      bingSiteVerification: settings.bingSiteVerification,
      yandexSiteVerification: settings.yandexSiteVerification,
      pinterestVerification: settings.pinterestVerification,
      facebookDomainVerification: settings.facebookDomainVerification,
      customVerificationTag: settings.customVerificationTag,
      verificationFiles: settings.verificationFiles,
      topBarEnabled: settings.topBarEnabled,
      contactInfo: settings.contactInfo,
      cookieConsentEnabled: settings.cookieConsentEnabled,
      cookieConsentConfig: settings.cookieConsentConfig,
      // Menu structure is safe to expose publicly and is needed for header/footer rendering
      menuStructure: settings.menuStructure,
    };
  }

  private parseVerificationFiles(value: unknown): VerificationFileMap {
    if (!isRecord(value)) {
      return {};
    }

    const entries: VerificationFileMap = {};
    for (const [platform, entry] of Object.entries(value)) {
      if (!isRecord(entry)) {
        continue;
      }
      const filename = parseString(entry.filename);
      const content = parseString(entry.content);
      if (!platform || !filename || !content) {
        continue;
      }
      entries[platform] = {
        filename,
        content,
        description: parseString(entry.description) || undefined,
        uploadedAt: parseString(entry.uploadedAt) || new Date().toISOString(),
        size: parseNumber(entry.size, Buffer.byteLength(content, 'utf8')),
      };
    }
    return entries;
  }

  // Verification File Management
  async uploadVerificationFile(dto: UploadVerificationFileDto) {
    const { platform, filename, content, description } = dto;

    // Validate file size (max 10KB)
    const sizeInBytes = Buffer.byteLength(content, 'utf8');
    if (sizeInBytes > 10240) {
      throw new BadRequestException('File content exceeds 10KB limit');
    }

    // Validate filename extensions
    const validExtensions = ['.html', '.txt', '.json', '.xml'];
    const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    if (!hasValidExtension) {
      throw new BadRequestException('Invalid file type. Allowed: .html, .txt, .json, .xml');
    }

    const settings = await this.getSettings();
    const verificationFiles = this.parseVerificationFiles(settings.verificationFiles);

    verificationFiles[platform] = {
      filename,
      content,
      description: description || '',
      uploadedAt: new Date().toISOString(),
      size: sizeInBytes,
    };

    await this.updateSettings({ verificationFiles });

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

    return {
      message: 'Verification file uploaded successfully',
      platform,
      filename,
      publicUrl: `${baseUrl}/${filename}`,
      size: sizeInBytes,
    };
  }

  async getVerificationFiles() {
    const settings = await this.getSettings();
    const verificationFiles = this.parseVerificationFiles(settings.verificationFiles);

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

    return Object.entries(verificationFiles).map(([platform, data]) => ({
      platform,
      filename: data.filename,
      description: data.description || '',
      uploadedAt: data.uploadedAt,
      size: data.size,
      publicUrl: `${baseUrl}/${data.filename}`,
    }));
  }

  async deleteVerificationFile(platform: string) {
    const settings = await this.getSettings();
    const verificationFiles = this.parseVerificationFiles(settings.verificationFiles);

    if (!verificationFiles[platform]) {
      throw new NotFoundException(`No verification file found for platform: ${platform}`);
    }

    delete verificationFiles[platform];
    await this.updateSettings({ verificationFiles });

    return {
      message: 'Verification file deleted successfully',
      platform,
    };
  }

  async serveVerificationFile(filename: string) {
    const settings = await this.getSettings();
    const verificationFiles = this.parseVerificationFiles(settings.verificationFiles);

    // Find file by filename
    for (const [platform, data] of Object.entries(verificationFiles)) {
      if (data.filename === filename) {
        return {
          content: data.content,
          contentType: this.getContentType(filename),
        };
      }
    }

    throw new NotFoundException(`Verification file not found: ${filename}`);
  }

  private getContentType(filename: string): string {
    if (filename.endsWith('.html')) return 'text/html';
    if (filename.endsWith('.txt')) return 'text/plain';
    if (filename.endsWith('.json')) return 'application/json';
    if (filename.endsWith('.xml')) return 'application/xml';
    return 'text/plain';
  }
}
