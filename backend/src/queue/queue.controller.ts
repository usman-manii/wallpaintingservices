import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generatePost(@Body() body: { topic: string }) {
    const job = await this.queueService.addJob('GENERATE_POST', {
      topic: body.topic,
    });
    return {
      success: true,
      jobId: job.id,
      message: 'Job queued successfully',
    };
  }
}
