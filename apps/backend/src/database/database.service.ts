import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 8000, // 8s – fail fast if DB unreachable (keeps deploy from hanging)
      idleTimeoutMillis: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT 1');
    } catch (err) {
      console.error('Database connection failed at startup:', err instanceof Error ? err.message : err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]) {
    const result = await this.pool.query<T>(text, params);
    return result;
  }
}

