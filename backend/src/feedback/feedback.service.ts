import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SEOAuditService } from '../blog/seo-audit.service';
import { AiBlogService } from '../blog/ai-blog.service';
import { CommentModerationService } from '../comment/comment-moderation.service';
import { ContactService } from '../contact/contact.service';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private seoAuditService: SEOAuditService,
    private aiBlogService: AiBlogService,
    private commentModerationService: CommentModerationService,
    private contactService: ContactService,
  ) {}

  /**
   * Unified overview for the admin feedback dashboard
   */
  async getOverview() {
    try {
      const [seoSiteAudit, aiStats, commentStats, contactCount, latestContacts] =
        await Promise.allSettled([
          this.seoAuditService.auditSite().catch(() => ({ overallScore: 0, issues: [] })),
          this.aiBlogService.getAiStatistics().catch(() => ({ totalGenerated: 0, autoTagged: 0 })),
          this.commentModerationService.getCommentStats().catch(() => ({ total: 0, pending: 0, approved: 0 })),
          this.prisma.contactMessage.count().catch(() => 0),
          this.prisma.contactMessage.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
          }).catch(() => []),
        ]);

      const interlinkingStats = await this.aiBlogService.getInterlinkingStats().catch(() => ({
        totalLinks: 0,
        linkedPosts: 0,
        avgLinksPerPost: 0,
      }));

      return {
        seo: seoSiteAudit.status === 'fulfilled' ? seoSiteAudit.value : { overallScore: 0, issues: [] },
        aiContent: aiStats.status === 'fulfilled' ? aiStats.value : { totalGenerated: 0, autoTagged: 0 },
        interlinking: interlinkingStats,
        comments: commentStats.status === 'fulfilled' ? commentStats.value : { total: 0, pending: 0, approved: 0 },
        contact: {
          totalMessages: contactCount.status === 'fulfilled' ? contactCount.value : 0,
          latestMessages: latestContacts.status === 'fulfilled' ? latestContacts.value : [],
        },
      };
    } catch (error) {
      // Return default structure if everything fails
      return {
        seo: { overallScore: 0, issues: [] },
        aiContent: { totalGenerated: 0, autoTagged: 0 },
        interlinking: { totalLinks: 0, linkedPosts: 0, avgLinksPerPost: 0 },
        comments: { total: 0, pending: 0, approved: 0 },
        contact: {
          totalMessages: 0,
          latestMessages: [],
        },
      };
    }
  }

  /**
   * Post-level feedback: combines SEO audit + AI metadata + interlinking
   */
  async getPostFeedback(postId: string) {
    const [seoAudit, post] = await Promise.all([
      this.seoAuditService.auditPost(postId),
      this.prisma.post.findUnique({
        where: { id: postId },
        include: {
          tags: true,
          categories: true,
          comments: {
            where: { isApproved: true, isSpam: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      }),
    ]);

    if (!post) {
      return null;
    }

    return {
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        publishedAt: post.publishedAt,
        viewCount: post.viewCount,
        readingTime: post.readingTime,
        tags: post.tags,
        categories: post.categories,
      },
      seo: seoAudit,
      aiMetadata: post.aiMetadata,
      comments: post.comments,
    };
  }
}

