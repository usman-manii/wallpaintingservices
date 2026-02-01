
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SanitizationUtil } from '../common/utils/sanitization.util';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // Create
  async createPost(data: Prisma.PostCreateInput) {
    // SECURITY FIX: Sanitize HTML content before saving
    if (data.content && typeof data.content === 'string') {
      data.content = SanitizationUtil.sanitizeHTML(data.content);
    }
    if (data.excerpt && typeof data.excerpt === 'string') {
      data.excerpt = SanitizationUtil.sanitizeText(data.excerpt);
    }
    
    return this.prisma.post.create({ data });
  }

  // Read
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
    include?: Prisma.PostInclude;
  }) {
    const { skip, take, cursor, where, orderBy, include } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: include || { author: true, categories: true, tags: true },
    });
  }

  async findById(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: { author: true, categories: true, tags: true },
    });
  }

  async findOne(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { author: true, categories: true, tags: true },
    });

    if (post?.content && post.tags?.length) {
      post.content = this.linkTagsInContent(post.content, post.tags);
    }

    return post;
  }

  // Update
  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }) {
    const { where, data } = params;
    
    // SECURITY FIX: Sanitize HTML content before saving
    if (data.content && typeof data.content === 'string') {
      data.content = SanitizationUtil.sanitizeHTML(data.content);
    }
    if (data.excerpt && typeof data.excerpt === 'string') {
      data.excerpt = SanitizationUtil.sanitizeText(data.excerpt);
    }
    
    return this.prisma.post.update({
      data,
      where,
    });
  }

  // Delete
  async deletePost(where: Prisma.PostWhereUniqueInput) {
    return this.prisma.post.delete({
      where,
    });
  }

  /**
   * Lightweight auto-linking of tag mentions to tag archive pages
   */
  private linkTagsInContent(content: string, tags: { name: string; slug: string }[]) {
    let html = content;
    for (const tag of tags) {
      const pattern = new RegExp(`(?![^<]*>)\\b(${this.escapeRegex(tag.name)})\\b`, 'i');
      const replacement = `<a href="/blog?tag=${tag.slug}" class="text-blue-600 underline">$1</a>`;
      html = html.replace(pattern, replacement);
    }
    return html;
  }

  private escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
