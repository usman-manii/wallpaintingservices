import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { ConfigService } from '@nestjs/config';
import { Post } from '@prisma/client';

type SocialChannel = {
  id: string;
  name?: string;
  platform?: string;
  enabled?: boolean;
  apiKey?: string;
};

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

const getErrorStack = (error: unknown): string | undefined => (
  error instanceof Error ? error.stack : undefined
);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseSocialLinks = (value: unknown): SocialChannel[] => (
  Array.isArray(value)
    ? value.filter(isRecord).map((channel) => ({
        id: String(channel.id ?? ''),
        name: typeof channel.name === 'string' ? channel.name : undefined,
        platform: typeof channel.platform === 'string' ? channel.platform : undefined,
        enabled: typeof channel.enabled === 'boolean' ? channel.enabled : undefined,
        apiKey: typeof channel.apiKey === 'string' ? channel.apiKey : undefined,
      })).filter((channel) => channel.id.length > 0)
    : []
);

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
    const socialLinks = parseSocialLinks(settings?.socialLinks);

    // Filter channels to target
    const targetChannels = socialLinks.filter((channel) =>
      channel.enabled &&
      (channels.length === 0 || channels.includes(channel.id))
    );

    if (targetChannels.length === 0) {
      this.logger.warn('No enabled social channels found for distribution.');
      return;
    }

    this.logger.log(`[SOCIAL] Distributing post "${post.title}" to ${targetChannels.length} channel(s)`);

    // In a real implementation, we would call each API here.
    // For now, we simulate the API calls.
    for (const channel of targetChannels) {
      try {
        await this.postToChannel(channel, post);
      } catch (error) {
        this.logger.error(
          `[SOCIAL] Failed to post to ${channel.name ?? channel.id}: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
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

  private async postToChannel(channel: SocialChannel, post: Post) {
    const channelName = channel.name ?? channel.platform ?? channel.id;
    this.logger.log(`[SOCIAL] Posting to ${channelName} (${channel.id})...`);

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    if (channel.apiKey === 'FAIL') {
      throw new Error('Simulated API Failure');
    }

    this.logger.log(`[SOCIAL] Posted to ${channelName}`);
  }
}
