-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PostStatus" ADD VALUE 'AI_QUEUE';
ALTER TYPE "PostStatus" ADD VALUE 'AI_GENERATING';
ALTER TYPE "PostStatus" ADD VALUE 'AI_REVIEW';
ALTER TYPE "PostStatus" ADD VALUE 'APPROVED_DRAFT';
ALTER TYPE "PostStatus" ADD VALUE 'REFRESH_QUEUE';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiPrompt" TEXT,
ADD COLUMN     "contentAge" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "generationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "lastRefreshedAt" TIMESTAMP(3),
ADD COLUMN     "needsRefresh" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refreshReason" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "wordCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "aiAutoApprove" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "aiBatchSize" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiGenerationSchedule" TEXT NOT NULL DEFAULT '0 2 * * *',
ADD COLUMN     "aiMaxWordCount" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "aiMinWordCount" INTEGER NOT NULL DEFAULT 3000,
ADD COLUMN     "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
ADD COLUMN     "aiProvider" TEXT NOT NULL DEFAULT 'openai',
ADD COLUMN     "autoInterlinkEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoTaggingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contentFocus" TEXT,
ADD COLUMN     "contentRefreshEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contentTone" TEXT NOT NULL DEFAULT 'professional',
ADD COLUMN     "interlinkingSchedule" TEXT NOT NULL DEFAULT '0 3 * * *',
ADD COLUMN     "maxInterlinksPerPost" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "maxTagsPerPost" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "minInterlinksPerPost" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "minTagsPerPost" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "refreshAfterDays" INTEGER NOT NULL DEFAULT 180,
ADD COLUMN     "refreshCheckSchedule" TEXT NOT NULL DEFAULT '0 4 * * 0',
ADD COLUMN     "siteKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetAudience" TEXT;
