
import { Module, forwardRef } from '@nestjs/common';
import { SocialService } from './social.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, forwardRef(() => QueueModule), ConfigModule],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
