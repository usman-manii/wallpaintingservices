
import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { BlogSEOController } from './blog-seo.controller';
import { AiBlogController } from './ai-blog.controller';
import { EnhancedBlogService } from './enhanced-blog.service';
import { SEOAuditService } from './seo-audit.service';
import { AiBlogService } from './ai-blog.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [BlogController, BlogSEOController, AiBlogController],
  providers: [BlogService, EnhancedBlogService, SEOAuditService, AiBlogService],
  exports: [BlogService, EnhancedBlogService, SEOAuditService, AiBlogService], // Export for Queue and Tasks
})
export class BlogModule {}
