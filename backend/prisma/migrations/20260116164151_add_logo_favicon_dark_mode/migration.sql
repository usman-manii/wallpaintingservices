-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "darkMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "favicon" TEXT,
ADD COLUMN     "logo" TEXT;
