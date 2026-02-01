-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "appearanceSettings" JSONB,
ADD COLUMN     "blogPageId" TEXT,
ADD COLUMN     "contactInfo" JSONB,
ADD COLUMN     "homePageId" TEXT,
ADD COLUMN     "menuStructure" JSONB,
ADD COLUMN     "topBarEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "widgetConfig" JSONB;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "linkedTagIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mergeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "synonymHits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[];
