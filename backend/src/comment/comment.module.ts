import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { CommentModerationService } from './comment-moderation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentController],
  providers: [CommentService, CommentModerationService],
  exports: [CommentService, CommentModerationService],
})
export class CommentModule {}
