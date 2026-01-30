-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "bingSiteVerification" TEXT,
ADD COLUMN     "facebookDomainVerification" TEXT,
ADD COLUMN     "googleSiteVerification" TEXT,
ADD COLUMN     "pinterestVerification" TEXT,
ADD COLUMN     "verificationFiles" JSONB,
ADD COLUMN     "yandexSiteVerification" TEXT;
