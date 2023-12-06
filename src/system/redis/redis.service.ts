import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  public async get(key: string) {
    return await this.cacheManager.get(key);
  }

  public async set(key: string, value: any) {
    return await this.cacheManager.set(key, value);
  }

  public async del(key: any) {
    await this.cacheManager.del(key);
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
