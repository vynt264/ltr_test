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
config();
const configService = new ConfigService();
@Module({
  imports: [
    ConfigSystemModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      name: "read",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: "mysql",
        host: configService.get("DB_READ_HOST"),
        port: configService.get("DB_READ_PORT"),
        username: configService.get("DB_READ_USERNAME"),
        password: configService.get("DB_READ_PASSWORD"),
        database: configService.get("DB_READ_DATABASE"),
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
