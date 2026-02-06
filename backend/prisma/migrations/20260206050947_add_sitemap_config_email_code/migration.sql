-- AlterTable
ALTER TABLE "EmailVerificationToken" ADD COLUMN     "codeHash" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "sitemapConfig" JSONB;
