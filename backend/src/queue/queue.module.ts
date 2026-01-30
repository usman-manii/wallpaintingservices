import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueWorker } from './queue.worker';
import { QueueController } from './queue.controller';
import { AiModule } from '../ai/ai.module';
import { BlogModule } from '../blog/blog.module';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    AiModule, 
    BlogModule, 
    forwardRef(() => SocialModule) // Break circular dependency if any
  ],
  controllers: [QueueController],
  providers: [QueueService, QueueWorker],
  exports: [QueueService],
})
export class QueueModule {}
