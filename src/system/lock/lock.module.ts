import { RedisModule } from "@liaoliaots/nestjs-redis";
import { Module } from "@nestjs/common";
import { RedisLockModule } from "nestjs-simple-redis-lock";
import { LockService } from "./lock.service";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
config();
const configService = new ConfigService();
@Module({
  imports: [
    RedisModule.forRoot({
      closeClient: false,
      config: {
        host: configService.get("REDIS_HOST"),
        port: configService.get("REDIS_PORT"),
        password: configService.get("REDIS_PASSWORD"),
      },
    }),
    RedisLockModule.register({}),
  ],
  providers: [RedisLockModule, LockService],
  exports: [LockService, RedisLockModule],
})
export class LockModule {}
