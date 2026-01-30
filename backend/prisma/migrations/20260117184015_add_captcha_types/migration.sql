-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "captchaType" TEXT NOT NULL DEFAULT 'recaptcha-v2',
ADD COLUMN     "recaptchaV2SecretKey" TEXT,
ADD COLUMN     "recaptchaV2SiteKey" TEXT,
ADD COLUMN     "recaptchaV3SecretKey" TEXT,
ADD COLUMN     "recaptchaV3SiteKey" TEXT;
