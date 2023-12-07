import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Common } from "./common.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { CommonController } from "./common.controller";
import { CommonService } from "./common.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Common]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [CommonController],
  providers: [CommonService],
})
export class CommonModule {}
