
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SocialService {
  private readonly logger = new Logger(SocialService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private config: ConfigService
  ) {}

  /**
   * Distribute a post to configured social channels
   */
  async distributePost(postId: string, channels: string[] = []) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    const settings = await this.prisma.siteSettings.findFirst();
    const socialLinks = settings?.socialLinks as any[] || [];

    // Filter channels to target
    const targetChannels = socialLinks.filter(c => 
      c.enabled && 
      (channels.length === 0 || channels.includes(c.id))
    );

    if (targetChannels.length === 0) {
      this.logger.warn(`No enabled social channels found for distribution.`);
      return;
    }

    this.logger.log(`📢 Distributing post "${post.title}" to ${targetChannels.length} channels`);

    // In a real implementation, we would call each API here.
    // For now, we simulate the API calls.
    for (const channel of targetChannels) {
      try {
        await this.postToChannel(channel, post);
      } catch (error) {
        this.logger.error(`Failed to post to ${channel.name}:`, error);
      }
    }
    
    // Update post metadata to record distribution
    // We'll store this in JSON for now if schema doesn't support structured history yet
    /*
    await this.prisma.post.update({
        where: { id: postId },
        data: {
            socialDistribution: {
                lastSharedAt: new Date(),
                channels: targetChannels.map(c => c.id)
            }
        }
    });
    */
  }

  private async postToChannel(channel: any, post: any) {
     const channelName = channel.name || channel.platform;
     const channelId = channel.id || 'unknown';
     this.logger.log(`   ➡️ Posting to ${channelName} (${channelId})...`);
     
     // Simulate API latency
     await new Promise(resolve => setTimeout(resolve, 500));
     
     if (channel.apiKey === 'FAIL') {
         throw new Error('Simulated API Failure');
     }
     
     this.logger.log(`   ✅ Posted to ${channelName}`);
  }
}
