// backend/src/comment/comment-moderation.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizationUtil } from '../common/utils/sanitization.util';

@Injectable()
export class CommentModerationService {
  constructor(private prisma: PrismaService) {}

  // Simple spam detection keywords
  private spamKeywords = ['viagra', 'casino', 'lottery', 'click here', 'buy now', 'limited offer', 'act now'];
  
  /**
   * Create comment with automatic spam detection
   */
  async createComment(data: {
    postId: string;
    content: string;
    userId?: string;
    authorName?: string;
    authorEmail?: string;
    authorWebsite?: string;
    ipAddress?: string;
    userAgent?: string;
    parentId?: string;
  }) {
    const sanitizedContent = SanitizationUtil.sanitizeText(data.content);
    const sanitizedName = data.authorName ? SanitizationUtil.sanitizeText(data.authorName) : undefined;
    const sanitizedEmail = data.authorEmail ? SanitizationUtil.sanitizeEmail(data.authorEmail) : undefined;
    const sanitizedWebsite = data.authorWebsite ? SanitizationUtil.sanitizeURL(data.authorWebsite) : undefined;

    // Check for spam
    const isSpam = this.detectSpam(sanitizedContent);
    
    // Auto-approve for logged-in users with good history
    let isApproved = false;
    if (data.userId) {
      const userComments = await this.prisma.comment.count({
        where: {
          userId: data.userId,
          isApproved: true,
          isSpam: false,
        },
      });
      
      // Auto-approve if user has 3+ approved comments
      isApproved = userComments >= 3;
    }
    
    return this.prisma.comment.create({
      data: {
        content: sanitizedContent,
        post: { connect: { id: data.postId } },
        user: data.userId ? { connect: { id: data.userId } } : undefined,
        authorName: sanitizedName,
        authorEmail: sanitizedEmail || undefined,
        authorWebsite: sanitizedWebsite || undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        parent: data.parentId ? { connect: { id: data.parentId } } : undefined,
        isApproved,
        isSpam,
      },
      include: {
        user: { select: { username: true, displayName: true } },
        replies: { where: { isApproved: true } },
      },
    });
  }

  /**
   * Simple spam detection
   */
  private detectSpam(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    // Check for spam keywords
    if (this.spamKeywords.some(keyword => lowerContent.includes(keyword))) {
      return true;
    }
    
    // Check for excessive links
    const linkCount = (content.match(/https?:\/\//g) || []).length;
    if (linkCount > 3) {
      return true;
    }
    
    // Check for excessive capital letters (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.5 && content.length > 20) {
      return true;
    }
    
    return false;
  }

  /**
   * Get all comments for moderation (admin panel)
   */
  async getPendingComments(options: { skip?: number; take?: number } = {}) {
    return this.prisma.comment.findMany({
      where: { isApproved: false, isSpam: false },
      include: {
        post: { select: { id: true, title: true, slug: true } },
        user: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip || 0,
      take: options.take || 20,
    });
  }

  /**
   * Get spam comments
   */
  async getSpamComments(options: { skip?: number; take?: number } = {}) {
    return this.prisma.comment.findMany({
      where: { isSpam: true },
      include: {
        post: { select: { id: true, title: true, slug: true } },
        user: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip || 0,
      take: options.take || 20,
    });
  }

  /**
   * Get flagged comments
   */
  async getFlaggedComments(options: { skip?: number; take?: number } = {}) {
    return this.prisma.comment.findMany({
      where: { isFlagged: true },
      include: {
        post: { select: { id: true, title: true, slug: true } },
        user: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip || 0,
      take: options.take || 20,
    });
  }

  /**
   * Approve comment
   */
  async approveComment(id: string, moderatorId: string) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        isApproved: true,
        isSpam: false,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });
  }

  /**
   * Reject/delete comment
   */
  async rejectComment(id: string, moderatorId: string) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        isApproved: false,
        isSpam: true,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });
  }

  /**
   * Flag comment for review
   */
  async flagComment(id: string, reason: string) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        isFlagged: true,
        flagReason: reason,
      },
    });
  }

  /**
   * Bulk approve comments
   */
  async bulkApprove(ids: string[], moderatorId: string) {
    return this.prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: {
        isApproved: true,
        isSpam: false,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });
  }

  /**
   * Bulk delete/spam comments
   */
  async bulkReject(ids: string[], moderatorId: string) {
    return this.prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: {
        isApproved: false,
        isSpam: true,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
      },
    });
  }

  /**
   * Get comment statistics
   */
  async getCommentStats() {
    const [total, approved, pending, spam, flagged] = await Promise.all([
      this.prisma.comment.count(),
      this.prisma.comment.count({ where: { isApproved: true } }),
      this.prisma.comment.count({ where: { isApproved: false, isSpam: false } }),
      this.prisma.comment.count({ where: { isSpam: true } }),
      this.prisma.comment.count({ where: { isFlagged: true } }),
    ]);
    
    return { total, approved, pending, spam, flagged };
  }

  /**
   * Get comments by post (public, only approved)
   */
  async getCommentsForPost(postId: string) {
    return this.prisma.comment.findMany({
      where: {
        postId,
        isApproved: true,
        isSpam: false,
        parentId: null, // Only root comments
      },
      include: {
        user: { select: { username: true, displayName: true } },
        replies: {
          where: { isApproved: true, isSpam: false },
          include: {
            user: { select: { username: true, displayName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete old spam comments (for cron job)
   */
  async deleteOldSpam(olderThan: Date) {
    return this.prisma.comment.deleteMany({
      where: {
        isSpam: true,
        createdAt: { lt: olderThan },
      },
    });
  }
}
