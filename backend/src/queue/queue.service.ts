import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus, Prisma } from '@prisma/client';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a job to the Postgres Queue
   */
  async addJob(type: string, payload: any) {
    return this.prisma.queueJob.create({
      data: {
        type,
        payload,
        status: JobStatus.PENDING,
      },
    });
  }

  /**
   * Fetch job status
   */
  async getJob(id: string) {
    return this.prisma.queueJob.findUnique({
      where: { id },
    });
  }
}
