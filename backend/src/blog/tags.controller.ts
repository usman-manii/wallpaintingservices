import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { EnhancedBlogService } from './enhanced-blog.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly enhancedBlogService: EnhancedBlogService) {}

  @Public()
  @Get()
  async listTags() {
    return this.enhancedBlogService.getPublicTags();
  }

  @Public()
  @Get('trending')
  async listTrendingTags() {
    return this.enhancedBlogService.getTrendingTags();
  }
}
