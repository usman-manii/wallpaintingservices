import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

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
  contactInfo?: any;

  @IsOptional()
  @IsObject()
  menuStructure?: any;

  @IsOptional()
  @IsObject()
  widgetConfig?: any;

  @IsOptional()
  @IsObject()
  appearanceSettings?: any;

  @IsOptional()
  @IsObject()
  socialLinks?: any;

  @IsOptional()
  @IsObject()
  aiConfig?: any;

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
}
