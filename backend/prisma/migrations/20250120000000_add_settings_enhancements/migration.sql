-- Add new fields to SiteSettings for enhanced settings management
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "homePageId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "blogPageId" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "topBarEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "contactInfo" JSONB;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "menuStructure" JSONB;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "widgetConfig" JSONB;
ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "appearanceSettings" JSONB;
