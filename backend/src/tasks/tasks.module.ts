import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { SitemapService } from './sitemap.service';
import { TasksController } from './tasks.controller';
import { BlogModule } from '../blog/blog.module';
import { CommentModule } from '../comment/comment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BlogModule,
    CommentModule,
    PrismaModule,
    AiModule,
    SocialModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, SitemapService],
  exports: [TasksService, SitemapService],
})
export class TasksModule {}
