import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LotteryAward } from "./lottery.award.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { LotteryAwardController } from "./lottery.award.controller";
import { LotteryAwardService } from "./lottery.award.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { User } from "../user/user.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { OrderRequestModule } from "../order.request/order.request.module";
import { LotteryRequest } from "../lottery.request/lottery.request.entity";
import { LotteryFtQueue } from "../lottery.request/lottery.ft.queue";

@Module({
  imports: [
    TypeOrmModule.forFeature([LotteryAward, SysConfig, User, LotteryRequest, LotteryFtQueue,]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
    OrderRequestModule,
  ],
  controllers: [LotteryAwardController],
  providers: [LotteryAwardService],
})
export class LotteryAwardModule {}
