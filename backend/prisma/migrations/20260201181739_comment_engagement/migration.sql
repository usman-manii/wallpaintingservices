-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "editedBy" TEXT,
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reactions" JSONB,
ADD COLUMN     "staffNote" TEXT,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;
