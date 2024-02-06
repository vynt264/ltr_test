import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import { RedisClient } from 'redis';

import { RedisCache } from './redis.interface';

@Injectable()
export class RedisCacheService {
  private redisClient: RedisClient;
  constructor(@Inject(CACHE_MANAGER) private cacheManager: RedisCache) {
    this.redisClient = this.cacheManager.store.getClient();
  }
  
  public async get(key: string) {
    return await this.cacheManager.get(key);
  }

  public async set(key: string, value: any) {
    return await this.cacheManager.set(key, value);
  }

  public async del(key: any) {
    await this.cacheManager.del(key);
  }

  public async incr(key: string) {
    return this.redisClient.incr(key);
  }

  public async lock(key: string) {
    this.cacheManager.set(key, key, 50); // ttl :50s
  }

  public async isLocked(key: string) {
    const locked = await this.cacheManager.get(key);
    return locked != null;
  }

  public async unLocked(key: string) {
    this.del(key);
  }
}
