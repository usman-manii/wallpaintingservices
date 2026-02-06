import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { BlogService } from '../blog/blog.service';
import { SocialService } from '../social/social.service';
import { JobStatus, QueueJob } from '@prisma/client';
import { JsonValue } from '../common/types/json';

type AiGeneratedPost = {
  title: string;
  content: string;
  summary?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
};

type GeneratePostPayload = {
  topic: string;
  userId?: string;
};

type DistributePostPayload = {
  postId: string;
  channels?: string[];
};

const getErrorMessage = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

const getErrorStack = (error: unknown): string | undefined => (
  error instanceof Error ? error.stack : undefined
);

const isRecord = (value: unknown): value is Record<string, JsonValue> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parsePayload = (value: unknown): Record<string, JsonValue> => (
  isRecord(value) ? value : {}
);

const parseGeneratePostPayload = (value: unknown): GeneratePostPayload => {
  const payload = parsePayload(value);
  return {
    topic: typeof payload.topic === 'string' ? payload.topic : '',
    userId: typeof payload.userId === 'string' ? payload.userId : undefined,
  };
};

const parseDistributePostPayload = (value: unknown): DistributePostPayload => {
  const payload = parsePayload(value);
  return {
    postId: typeof payload.postId === 'string' ? payload.postId : '',
    channels: Array.isArray(payload.channels)
      ? payload.channels.filter((channel): channel is string => typeof channel === 'string')
      : undefined,
  };
};

const parseGeneratedPost = (value: unknown): AiGeneratedPost | null => {
  if (!isRecord(value)) return null;

  const title = typeof value.title === 'string' ? value.title : '';
  const content = typeof value.content === 'string' ? value.content : '';

  if (!title || !content) return null;

  return {
    title,
    content,
    summary: typeof value.summary === 'string' ? value.summary : undefined,
    seoTitle: typeof value.seoTitle === 'string' ? value.seoTitle : undefined,
    seoDescription: typeof value.seoDescription === 'string' ? value.seoDescription : undefined,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
  };
};

@Injectable()
export class QueueWorker implements OnModuleInit {
  private readonly logger = new Logger(QueueWorker.name);
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private blogService: BlogService,
    private socialService: SocialService,
  ) {}

  onModuleInit() {
    // Start the polling loop
    this.poll();
  }

  async poll() {
    if (this.isProcessing) return;

    // Simple polling interval - in production can use more sophisticated backoff
    setInterval(async () => {
      await this.processNextJob();
    }, 5000);
  }

  async processNextJob() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Atomic claim: use a transaction so multiple workers don't pick the same job
      const job = await this.prisma.$transaction(async (tx) => {
        const jobs = await tx.$queryRaw<QueueJob[]>`
          SELECT * FROM "QueueJob"
          WHERE status = 'PENDING'
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `;

        if (jobs.length === 0) {
          return null;
        }

        const claimed = jobs[0];
        await tx.queueJob.update({
          where: { id: claimed.id },
          data: {
            status: JobStatus.PROCESSING,
            lockedAt: new Date(),
            attempts: { increment: 1 },
          },
        });

        return claimed;
      });

      if (!job) {
        return;
      }

      this.logger.log(`Processing job [${job.id}] type: ${job.type}`);

      // REROUTE TO HANDLER
      let result: JsonValue | null = null;
      try {
        switch (job.type) {
          case 'GENERATE_POST': {
            const payload = parseGeneratePostPayload(job.payload);
            if (!payload.topic) {
              throw new Error('Missing topic in GENERATE_POST payload');
            }

            const rawResult = await this.aiService.generatePost(payload.topic);
            const parsedResult = parseGeneratedPost(rawResult);
            if (!parsedResult) {
              throw new Error('AI generation returned invalid content');
            }

            // AUTOMATICALLY SAVE TO BLOG
            // Use payload.userId if available, otherwise fallback to first admin
            let authorId = payload.userId;

            if (!authorId) {
              const admin = await this.prisma.user.findFirst();
              authorId = admin?.id;
            }

            if (authorId) {
              const tags = Array.isArray(parsedResult.tags) ? parsedResult.tags : [];
              const baseSlugSource = parsedResult.seoTitle || parsedResult.title || payload.topic || 'post';
              const slug = baseSlugSource
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

              const tagConnections = tags.map((tag) => ({
                where: { slug: tag.toLowerCase().replace(/ /g, '-') },
                create: { name: tag, slug: tag.toLowerCase().replace(/ /g, '-') },
              }));

              // Extract keywords from content for SEO
              const content = parsedResult.content;
              const plainText = content.replace(/<[^>]*>/g, '');
              const words = plainText.toLowerCase().match(/\b\w{4,}\b/g) || [];
              const wordFreq: Record<string, number> = {};
              for (const word of words) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
              }
              const entries = Object.entries(wordFreq) as Array<[string, number]>;
              const topKeywords = entries
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([word]) => word);

              // Calculate reading time (200 words per minute)
              const wordCount = plainText.split(/\s+/).length;
              const readingTime = Math.ceil(wordCount / 200);

              // Generate excerpt from first paragraph
              const firstPara = content.match(/<p[^>]*>([^<]+)<\/p>/)?.[1] || parsedResult.summary || '';
              const excerpt = firstPara.length > 160 ? `${firstPara.substring(0, 157)}...` : firstPara;

              await this.blogService.createPost({
                title: parsedResult.title,
                content,
                excerpt: excerpt,
                slug: slug,
                author: { connect: { id: authorId } },
                status: 'DRAFT',
                seoTitle: parsedResult.seoTitle,
                seoDescription: parsedResult.seoDescription,
                seoKeywords: [...topKeywords, ...tags.map((tag) => tag.toLowerCase())],
                readingTime: readingTime,
                ogTitle: parsedResult.seoTitle,
                ogDescription: parsedResult.seoDescription,
                twitterCard: 'summary_large_image',
                tags: { connectOrCreate: tagConnections },
                aiMetadata: isRecord(rawResult) ? rawResult : { generatedAt: new Date().toISOString() },
              });
              this.logger.log(`Blog post draft created: ${slug}`);
            } else {
              this.logger.warn('No user found to assign post to.');
            }

            result = isRecord(rawResult) ? rawResult : { success: true };
            break;
          }

          case 'DISTRIBUTE_POST': {
            const distPayload = parseDistributePostPayload(job.payload);
            if (!distPayload.postId) {
              throw new Error('Missing postId in DISTRIBUTE_POST payload');
            }

            await this.socialService.distributePost(
              distPayload.postId,
              distPayload.channels || [],
            );
            result = { success: true, channels: distPayload.channels || [] };
            break;
          }

          case 'SEO_OPTIMIZE':
            // ...
            result = { success: false, message: 'SEO_OPTIMIZE not implemented' };
            break;
          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }

        // Success
        await this.prisma.queueJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.COMPLETED,
            result: result || {},
            processedAt: new Date(),
          },
        });
        this.logger.log(`Job [${job.id}] completed`);
      } catch (err) {
        this.logger.error(
          `Job [${job.id}] failed: ${getErrorMessage(err)}`,
          getErrorStack(err),
        );
        await this.prisma.queueJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            error: getErrorMessage(err),
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Worker loop error: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    } finally {
      this.isProcessing = false;
    }
  }
}
