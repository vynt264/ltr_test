import { Module } from "@nestjs/common";
import { ConfigSystemService } from "./config.service";

const configFactory = {
  provide: ConfigSystemService,
  useFactory: () => {
    const config = new ConfigSystemService();
    config.lofusingDotEnv();
    return config;
  },
};

@Module({
  imports: [],
  controllers: [],
  providers: [configFactory],
  exports: [configFactory],
})
export class ConfigSystemModule {}
