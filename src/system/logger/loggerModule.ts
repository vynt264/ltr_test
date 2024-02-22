import { Helper } from "../../common/helper/index";
import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

@Module({
  imports: [
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(info => `[${info.timestamp}]::{"level":"${info.level}"}::{"message":"${info.message}"}`),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: "./logs/debug/", //path to where save loggin result
          filename: `${Helper.convertTime(new Date())}.log`, //name of file where will be saved logging result
          level: "debug",
        }),
        new winston.transports.File({
          dirname: "./logs/errors/", //path to where save loggin result
          filename: `${Helper.convertTime(new Date())}.log`, //name of file where will be saved logging result
          level: "error",
        }),
        new winston.transports.File({
          dirname: "./logs/info/",
          filename: `${Helper.convertTime(new Date())}.log`,
          level: "info",
        }),
      ],
    }),
  ],
})
export class WinsModule {}
