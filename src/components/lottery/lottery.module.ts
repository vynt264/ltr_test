import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Lottery } from "./lottery.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { LotteryController } from "./lottery.controller";
import { LotteryService } from "./lottery.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { User } from "../user/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Lottery, SysConfig, User]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [LotteryController],
  providers: [LotteryService],
})
export class LotteryModule {}
