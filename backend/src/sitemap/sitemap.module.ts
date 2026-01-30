// backend/src/sitemap/sitemap.module.ts
import { Module } from '@nestjs/common';
import { SitemapController } from './sitemap.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [SitemapController],
})
export class SitemapModule {}
