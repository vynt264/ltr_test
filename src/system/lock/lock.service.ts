// import { RedisLockService } from "nestjs-simple-redis-lock";
// export class LockService {
//   constructor(protected readonly lockRedisService: RedisLockService) {}

//   async lock(key: string) {
//     /**
//      * Automatically unlock after 2min
//      * Try again after 50ms if failed
//      * The max times to retry is 100
//      */
//     await this.lockRedisService.lock(key, 2 * 60 * 1000, 500, 100);
//   }

//   async unlock(key: string) {
//     await this.lockRedisService.unlock(key);
//   }
// }
