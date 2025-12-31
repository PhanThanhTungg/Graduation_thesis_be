import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { EnvService } from '../env/env.service';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(private readonly envService: EnvService) {
    const redisUri = this.envService.get('REDIS_URI') || '';
    this.redis = new Redis(redisUri);
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  set(key: string, value: string, secondExpired?: number) {
    if (secondExpired) {
      return this.redis.set(key, value, 'EX', secondExpired);
    }
    return this.redis.set(key, value);
  }

  get(key: string) {
    return this.redis.get(key);
  }

  mget(keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }
    return this.redis.mget(keys);
  }

  delete(key: string) {
    return this.redis.del(key);
  }
}
