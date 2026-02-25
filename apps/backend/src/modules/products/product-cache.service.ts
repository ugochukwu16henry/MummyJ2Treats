import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class ProductCacheService {
  private client: RedisClientType | null = null;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) return;
    this.client = createClient({ url });
    this.client.connect().catch(console.error);
  }

  async getProductListCache(key: string) {
    if (!this.client) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setProductListCache(key: string, value: any, ttlSeconds = 3600) {
    if (!this.client) return;
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }
}
