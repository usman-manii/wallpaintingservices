import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsInt, Min, Max } from 'class-validator';
import { JsonValue } from '../../common/types/json';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  favicon?: string;

  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @IsOptional()
  @IsString()
  homePageLayout?: string;

  @IsOptional()
  @IsString()
  homePageId?: string | null;

  @IsOptional()
  @IsString()
  blogPageId?: string | null;

  @IsOptional()
  @IsBoolean()
  topBarEnabled?: boolean;

  @IsOptional()
  @IsObject()
  contactInfo?: Record<string, JsonValue>;

  @IsOptional()
  @IsObject()
  menuStructure?: Record<string, JsonValue>;

  @IsOptional()
  @IsObject()
  widgetConfig?: Record<string, JsonValue>;

  @IsOptional()
  @IsObject()
  appearanceSettings?: Record<string, JsonValue>;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, JsonValue>;

  @IsOptional()
  @IsArray()
  aiConfig?: JsonValue[];

  @IsOptional()
  @IsArray()
  siteKeywords?: string[];

  // CAPTCHA Settings
  @IsOptional()
  @IsString()
  captchaType?: string;

  @IsOptional()
  @IsString()
  recaptchaV2SiteKey?: string;

  @IsOptional()
  @IsString()
  recaptchaV2SecretKey?: string;

  @IsOptional()
  @IsString()
  recaptchaV3SiteKey?: string;

  @IsOptional()
  @IsString()
  recaptchaV3SecretKey?: string;

  @IsOptional()
  @IsString()
  recaptchaSiteKey?: string;

  @IsOptional()
  @IsString()
  recaptchaSecretKey?: string;

  @IsOptional()
  @IsBoolean()
  forceHttps?: boolean;

  // Site Verification Meta Tags
  @IsOptional()
  @IsString()
  googleSiteVerification?: string;

  @IsOptional()
  @IsString()
  bingSiteVerification?: string;

  @IsOptional()
  @IsString()
  yandexSiteVerification?: string;

  @IsOptional()
  @IsString()
  pinterestVerification?: string;

  @IsOptional()
  @IsString()
  facebookDomainVerification?: string;

  @IsOptional()
  @IsString()
  customVerificationTag?: string;

  @IsOptional()
  @IsBoolean()
  cookieConsentEnabled?: boolean;

  @IsOptional()
  @IsObject()
  cookieConsentConfig?: Record<string, JsonValue>;

  @IsOptional()
  @IsObject()
  notificationConfig?: Record<string, JsonValue>;

  @IsOptional()
  @IsObject()
  sitemapConfig?: Record<string, JsonValue>;

  @IsOptional()
  @IsString()
  aiMode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  aiLearningLevel?: number;

  @IsOptional()
  @IsBoolean()
  aiSelfLearningEnabled?: boolean;
}
