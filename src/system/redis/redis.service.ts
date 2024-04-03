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
    return this.cacheManager.del(key);
  }

  public async incr(key: string) {
    return this.redisClient.incr(key);
  }

  public async incrby(key: string, count: number) {
    return this.redisClient.incrby(key, count);
  }

  public async hgetall(key: string) {
    return this.redisClient.hgetall(key);
  }

  public async hkeys(key: string) {
    return this.redisClient.hkeys(key);
  } 

  public async hdel(key: string, field: string) {
    return this.redisClient.hdel(key, field);
  }

  public async hset(key: string, field: string, value: any) {
    return this.redisClient.hset(key, field, value);
  }

  public async append(key: string, value: any) {
    return this.redisClient.append(key, value);
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
