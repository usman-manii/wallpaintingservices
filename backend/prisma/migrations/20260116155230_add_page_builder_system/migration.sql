-- CreateEnum
CREATE TYPE "PageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('STATIC', 'DYNAMIC', 'TEMPLATE', 'HOMEPAGE', 'LANDING');

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "pageType" "PageType" NOT NULL DEFAULT 'STATIC',
    "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL,
    "customCss" TEXT,
    "customJs" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'default',
    "headerType" TEXT,
    "footerType" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT[],
    "ogImage" TEXT,
    "metaTags" JSONB,
    "mobileContent" JSONB,
    "tabletContent" JSONB,
    "parentId" TEXT,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "allowedRoles" "Role"[],
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "templateCategory" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "enableComments" BOOLEAN NOT NULL DEFAULT false,
    "enableSharing" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVersion" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "customCss" TEXT,
    "customJs" TEXT,
    "changeNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "thumbnail" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "preview" TEXT,
    "content" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "customCss" TEXT,
    "customJs" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesTo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "title" TEXT,
    "description" TEXT,
    "tags" TEXT[],
    "folder" TEXT DEFAULT 'uploads',
    "isOptimized" BOOLEAN NOT NULL DEFAULT false,
    "variants" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "Page_status_publishedAt_idx" ON "Page"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Page_pageType_idx" ON "Page"("pageType");

-- CreateIndex
CREATE INDEX "Page_authorId_idx" ON "Page"("authorId");

-- CreateIndex
CREATE INDEX "PageVersion_pageId_idx" ON "PageVersion"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_pageId_versionNumber_key" ON "PageVersion"("pageId", "versionNumber");

-- CreateIndex
CREATE INDEX "PageComponent_type_category_idx" ON "PageComponent"("type", "category");

-- CreateIndex
CREATE INDEX "PageComponent_isGlobal_idx" ON "PageComponent"("isGlobal");

-- CreateIndex
CREATE UNIQUE INDEX "PageTemplate_slug_key" ON "PageTemplate"("slug");

-- CreateIndex
CREATE INDEX "PageTemplate_category_idx" ON "PageTemplate"("category");

-- CreateIndex
CREATE INDEX "PageTemplate_isActive_idx" ON "PageTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSection_name_key" ON "GlobalSection"("name");

-- CreateIndex
CREATE INDEX "GlobalSection_type_idx" ON "GlobalSection"("type");

-- CreateIndex
CREATE INDEX "Media_mimeType_idx" ON "Media"("mimeType");

-- CreateIndex
CREATE INDEX "Media_folder_idx" ON "Media"("folder");

-- CreateIndex
CREATE INDEX "Media_uploadedById_idx" ON "Media"("uploadedById");

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
