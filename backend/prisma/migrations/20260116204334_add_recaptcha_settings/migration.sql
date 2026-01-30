-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "isPolicyPage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usePageBuilder" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "aiConfig" JSONB,
ADD COLUMN     "recaptchaSecretKey" TEXT,
ADD COLUMN     "recaptchaSiteKey" TEXT;
