import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
    });
    // Don't block startup: first request will establish connection
    void this.pool.query('SELECT 1').catch((err) => {
      console.error('Database connection check failed:', err instanceof Error ? err.message : err);
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]) {
    const result = await this.pool.query<T>(text, params);
    return result;
  }
}

