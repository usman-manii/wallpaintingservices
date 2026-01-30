// src/comment/comment.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async createComment(data: { postId: string; content: string; authorName?: string; authorEmail?: string; userId?: string }) {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        post: { connect: { id: data.postId } },
        ...(data.userId ? { user: { connect: { id: data.userId } } } : {}),
        authorName: data.authorName,
        authorEmail: data.authorEmail,
      },
    });
  }

  async getCommentsForPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, firstName: true, displayName: true } } }
    });
  }
}
