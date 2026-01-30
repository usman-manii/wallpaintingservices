import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { BlogService } from '../blog/blog.service';
import { SocialService } from '../social/social.service';
import { JobStatus, QueueJob } from '@prisma/client';

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
      let result: any = null;
      try {
        switch (job.type) {
          case 'GENERATE_POST': {
            const payload = (job.payload as any) || {};
            result = await this.aiService.generatePost(payload.topic);
            if (!result || !result.title || !result.content) {
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
              const tags = Array.isArray(result.tags) ? result.tags : [];
              const baseSlugSource = result.seoTitle || result.title || payload.topic || 'post';
              const slug = baseSlugSource
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

              const tagConnections = tags.map((t: string) => ({
                where: { slug: t.toLowerCase().replace(/ /g, '-') },
                create: { name: t, slug: t.toLowerCase().replace(/ /g, '-') },
              }));

              // Extract keywords from content for SEO
              const content = typeof result.content === 'string' ? result.content : '';
              const plainText = content.replace(/<[^>]*>/g, '');
              const words = plainText.toLowerCase().match(/\b\w{4,}\b/g) || [];
              const wordFreq = words.reduce((acc: any, word: string) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
              }, {});
              const topKeywords = Object.entries(wordFreq)
                .sort((a: any, b: any) => b[1] - a[1])
                .slice(0, 10)
                .map(([word]) => word);

              // Calculate reading time (200 words per minute)
              const wordCount = plainText.split(/\s+/).length;
              const readingTime = Math.ceil(wordCount / 200);

              // Generate excerpt from first paragraph
              const firstPara = content.match(/<p[^>]*>([^<]+)<\/p>/)?.[1] || result.summary || '';
              const excerpt = firstPara.length > 160 ? firstPara.substring(0, 157) + '...' : firstPara;

              await this.blogService.createPost({
                title: result.title,
                content,
                excerpt: excerpt,
                slug: slug,
                author: { connect: { id: authorId } },
                status: 'DRAFT',
                seoTitle: result.seoTitle,
                seoDescription: result.seoDescription,
                seoKeywords: [...topKeywords, ...tags.map((t: string) => t.toLowerCase())],
                readingTime: readingTime,
                ogTitle: result.seoTitle,
                ogDescription: result.seoDescription,
                twitterCard: 'summary_large_image',
                tags: { connectOrCreate: tagConnections },
                aiMetadata: result as any,
              });
              this.logger.log(`Blog post draft created: ${slug}`);
            } else {
              this.logger.warn('No user found to assign post to.');
            }

            break;
          }

          case 'DISTRIBUTE_POST': {
            const distPayload = job.payload as any;
            await this.socialService.distributePost(
              distPayload.postId,
              distPayload.channels || [],
            );
            result = { success: true, channels: distPayload.channels };
            break;
          }

          case 'SEO_OPTIMIZE':
            // ...
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
      } catch (err: any) {
        this.logger.error(`Job [${job.id}] failed: ${err.message}`);
        await this.prisma.queueJob.update({
          where: { id: job.id },
          data: {
            status: JobStatus.FAILED,
            error: err.message,
          },
        });
      }
    } catch (e) {
      this.logger.error('Worker loop error', e as Error);
    } finally {
      this.isProcessing = false;
    }
  }
}
