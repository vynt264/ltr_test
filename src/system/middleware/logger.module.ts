import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { ConfigSystemModule } from "../config.system/config.module";
import { Logger } from "./logger";
import { LoggerMiddleware } from "./logger.middleware";

@Module({
  imports: [ConfigSystemModule],
  controllers: [],
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule implements NestModule {
  public configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
