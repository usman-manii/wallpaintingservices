import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BlogModule } from '../blog/blog.module';
import { CommentModule } from '../comment/comment.module';
import { ContactModule } from '../contact/contact.module';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';

@Module({
  imports: [PrismaModule, BlogModule, CommentModule, ContactModule],
  providers: [FeedbackService],
  controllers: [FeedbackController],
})
export class FeedbackModule {}

