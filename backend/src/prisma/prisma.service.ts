import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load .env from backend root if not already loaded
dotenv.config({ path: path.join(__dirname, '../../../.env') });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        // Can't use logger before super() call due to TypeScript constraints
        throw new Error('DATABASE_URL is missing in environment variables');
    }
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    // @ts-ignore - Prisma adapter types not fully compatible
    super({ adapter });
  }

  async onModuleInit() {
    this.logger.log('Connecting to DB with Adapter...');
    try {
        await this.$connect();
        this.logger.log('Connected to DB successfully');
    } catch(e) {
        this.logger.error('Failed to connect to DB', e);
        throw e;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
