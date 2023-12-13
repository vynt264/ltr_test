import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SysLayout } from "./sys.layout.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { SysLayoutController } from "./sys.layout.controller";
import { SysLayoutService } from "./sys.layout.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SysLayout]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [SysLayoutController],
  providers: [SysLayoutService],
})
export class SysLayoutModule {}
