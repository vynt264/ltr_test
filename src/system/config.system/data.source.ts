import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
config();
const configService = new ConfigService();

const options: DataSourceOptions = {
  type: "mysql",
  host: configService.get("DB_HOST"),
  port: configService.get("DB_PORT"),
  username: configService.get("DB_USER"),
  password: configService.get("DB_PASSWORD"),
  database: configService.get("DB_NAME"),
  // migrationsTableName: "migrations",
  entities: ["../../components/**/*.entity.{js,ts}"],
  // migrations: ["../../migrations/migration/*.{js,ts}"],
  extra: {
    charset: "utf8mb4_unicode_ci",
  },
  synchronize: true,
  logging: true,
};

export const AppDataSource = new DataSource(options);
