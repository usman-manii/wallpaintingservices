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
  private pool!: Pool;

  constructor() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        // Can't use logger before super() call due to TypeScript constraints
        throw new Error('DATABASE_URL is missing in environment variables');
    }
    
    // Enhanced connection pool configuration
    const pool = new Pool({ 
      connectionString: url,
      // Optimal pool settings for production
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),        // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),         // Minimum idle connections
      idleTimeoutMillis: 30000,                                   // Close idle connections after 30s
      connectionTimeoutMillis: 10000,                             // Timeout for acquiring connection
      maxUses: 7500,                                              // Retire connections after 7500 uses
    });
    
    const adapter = new PrismaPg(pool);
    
    // @ts-ignore - Prisma adapter types not fully compatible
    super({ 
      adapter,
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
        // Only log slow queries in development
        ...(process.env.NODE_ENV !== 'production' ? [{ level: 'query' as const, emit: 'event' as const }] : []),
      ],
    });
    
    // Assign pool AFTER super() call
    this.pool = pool;
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to database with optimized connection pool...');
    
    // Set up Prisma event listeners for monitoring
    this.$on('warn' as any, (e: any) => {
      this.logger.warn(`Prisma Warning: ${e.message}`);
    });

    this.$on('error' as any, (e: any) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    // Log slow queries in development (queries taking > 2s)
    if (process.env.NODE_ENV !== 'production') {
      this.$on('query' as any, (e: any) => {
        if (e.duration > 2000) {
          this.logger.warn(`🐌 Slow Query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    // Pool event monitoring
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected pool error:', err);
    });

    this.pool.on('connect', () => {
      this.logger.debug('New database connection established');
    });

    this.pool.on('remove', () => {
      this.logger.debug('Database connection removed from pool');
    });

    try {
        await this.$connect();
        this.logger.log(`✅ Connected to database successfully (Pool: ${this.pool.totalCount} connections)`);
    } catch(e) {
        this.logger.error('❌ Failed to connect to database', e);
        throw e;
    }
  }

  async onModuleDestroy() {
    this.logger.log('📤 Disconnecting from database...');
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('✅ Database connections closed');
  }

  /**
   * Get current pool statistics for monitoring
   */
  getPoolStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
    };
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}
