// src/settings/settings.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadVerificationFileDto } from './dto/verification-file.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.siteSettings.findFirst();
    if (!settings) {
      // Create default if not exists
      return this.prisma.siteSettings.create({
        data: {
          siteName: 'My AI Blog',
          description: 'A futuristic blog powered by AI',
        },
      });
    }
    return settings;
  }

  async updateSettings(data: Partial<Omit<any, 'id' | 'updatedAt'>>) {
    try {
      const start = await this.getSettings(); // ensure one exists
      
      // Clean up the data - remove undefined values and handle nulls properly
      // Also filter out any fields that don't exist in the Prisma schema
      const cleanData: any = {};
      const validFields = [
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
      ];
      
      Object.keys(data).forEach(key => {
        const value = (data as any)[key];
        // Only include defined values (null is allowed, undefined is not)
        // And only include fields that exist in the schema
        if (value !== undefined && validFields.includes(key)) {
          cleanData[key] = value;
        }
      });
      
      return await this.prisma.siteSettings.update({
        where: { id: start.id },
        data: cleanData,
      });
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('[SettingsService] Error updating settings:', error);
      throw new BadRequestException(
        error.message || 'Failed to update settings. Please check the data format.'
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
      // Menu structure is safe to expose publicly and is needed for header/footer rendering
      menuStructure: settings.menuStructure,
    };
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
    const verificationFiles = (settings.verificationFiles as any) || {};

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
    const verificationFiles = (settings.verificationFiles as any) || {};

    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

    return Object.entries(verificationFiles).map(([platform, data]: [string, any]) => ({
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
    const verificationFiles = (settings.verificationFiles as any) || {};

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
    const verificationFiles = (settings.verificationFiles as any) || {};

    // Find file by filename
    for (const [platform, data] of Object.entries(verificationFiles) as [string, any][]) {
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
