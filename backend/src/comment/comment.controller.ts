// src/comment/comment.controller.ts
import { Body, Controller, Get, Param, Post, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CommentService } from './comment.service';
import { CommentModerationService } from './comment-moderation.service';
import { Public } from '../auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedRequest } from '../common/types';

@Controller('comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly moderationService: CommentModerationService,
  ) {}

  @Public()
  @Post()
  async createComment(@Body() body: CreateCommentDto, @Request() req: ExpressRequest) {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      '0.0.0.0';
    const userAgent = req.headers['user-agent'];

    return this.moderationService.createComment({
      ...body,
      ipAddress,
      userAgent,
    });
  }

  @Public()
  @Get('post/:postId')
  async getComments(@Param('postId') postId: string) {
    return this.moderationService.getCommentsForPost(postId);
  }

  // Admin moderation endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('moderation/pending')
  async getPendingComments(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.moderationService.getPendingComments({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('moderation/spam')
  async getSpamComments(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.moderationService.getSpamComments({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('moderation/flagged')
  async getFlaggedComments(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.moderationService.getFlaggedComments({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('moderation/approved')
  async getApprovedComments(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.moderationService.getApprovedComments({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 20,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('moderation/all')
  async getAllComments(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.moderationService.getAllComments({
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 50,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Get('moderation/stats')
  async getCommentStats() {
    return this.moderationService.getCommentStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'SUPER_ADMIN', 'EDITOR')
  @Patch(':id/approve')
  async approveComment(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.moderationService.approveComment(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'EDITOR')
  @Patch(':id/reject')
  async rejectComment(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.moderationService.rejectComment(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'EDITOR')
  @Patch(':id/flag')
  async flagComment(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.moderationService.flagComment(id, body.reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'EDITOR')
  @Patch(':id/pin')
  async pinComment(@Param('id') id: string, @Body() body: { pinned: boolean }, @Request() req: AuthenticatedRequest) {
    return this.moderationService.togglePin(id, body.pinned ?? true, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'EDITOR')
  @Patch(':id/resolved')
  async resolveComment(@Param('id') id: string, @Body() body: { resolved: boolean }, @Request() req: AuthenticatedRequest) {
    return this.moderationService.markResolved(id, body.resolved ?? true, req.user.id);
  }

  @Public()
  @Patch(':id/vote')
  async voteComment(@Param('id') id: string, @Body() body: { up?: boolean; down?: boolean }) {
    const deltaUp = body.up ? 1 : 0;
    const deltaDown = body.down ? 1 : 0;
    return this.moderationService.vote(id, deltaUp, deltaDown);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'EDITOR')
  @Post('moderation/bulk-approve')
  async bulkApprove(@Body() body: { ids: string[] }, @Request() req: AuthenticatedRequest) {
    return this.moderationService.bulkApprove(body.ids, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMINISTRATOR', 'EDITOR')
  @Post('moderation/bulk-reject')
  async bulkReject(@Body() body: { ids: string[] }, @Request() req: AuthenticatedRequest) {
    return this.moderationService.bulkReject(body.ids, req.user.id);
  }
}
