
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
    return this.prisma.post.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { author: true, categories: true, tags: true },
    });
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
}
