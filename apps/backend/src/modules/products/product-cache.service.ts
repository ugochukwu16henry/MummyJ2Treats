import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class ProductCacheService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.client.connect().catch(console.error);
  }

  async getProductListCache(key: string) {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setProductListCache(key: string, value: any, ttlSeconds = 3600) {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }
}
