-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "region" TEXT,
ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "customVerificationTag" TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "isMultilingual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "translations" JSONB;
