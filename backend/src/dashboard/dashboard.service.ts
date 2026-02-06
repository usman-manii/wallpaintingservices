import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus, PostStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalDocs,
      published,
      drafts,
      scheduled,
      pendingJobs,
      users,
      pages,
      pendingComments,
    ] = await this.prisma.$transaction([
      this.prisma.post.count(),
      this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      this.prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      this.prisma.post.count({ where: { status: PostStatus.SCHEDULED } }),
      this.prisma.queueJob.count({
        where: { status: { in: [JobStatus.PENDING, JobStatus.PROCESSING] } },
      }),
      this.prisma.user.count(),
      this.prisma.page.count(),
      this.prisma.comment.count({ where: { isApproved: false, isSpam: false } }),
    ]);

    return {
      totalDocs,
      published,
      pending: pendingJobs,
      drafts,
      scheduled,
      users,
      pages,
      pendingComments,
    };
  }
}
