import { WinsModule } from "./system/logger/loggerModule";
import { Module } from "@nestjs/common";
import { MainModule } from "./components/main.module";
import { ConfigSystemModule } from "./system/config.system/config.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { config } from "dotenv";
import { LotteriesModule } from './lotteries/lotteries.module';
import { RedisCacheModule } from "./system/redis/redis.module";

config();
const configService = new ConfigService();
@Module({
  imports: [
    ConfigSystemModule,
    RedisCacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (confService: ConfigService) => ({
        type: "mysql",
        host: confService.get("DB_WRITE_HOST"),
        port: confService.get("DB_WRITE_PORT"),
        username: confService.get("DB_WRITE_USERNAME"),
        password: confService.get("DB_WRITE_PASSWORD"),
        database: confService.get("DB_WRITE_DATABASE"),
        entities: ["dist/components/**/*.entity.{js,ts}"],
        extra: {
          charset: "utf8mb4_unicode_ci",
          authPlugins: ["mysql_clear_password", "sha256_password"],
        },
        synchronize: true,
        autoLoadEntities: true,
        logging: false,
      }),
    }),
    ConfigModule.forRoot(),
    MainModule,
    WinsModule,
    ThrottlerModule.forRoot({
      ttl: configService.get("RATE_LIMIT_TTL"),
      limit: configService.get("RATE_LIMIT_MAX"),
    }),
    LotteriesModule,
  ],
})
export class AppModule {
  constructor(private readonly connection: Connection) {}
}
