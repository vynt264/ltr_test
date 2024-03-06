import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";
import { LotteryAwardModule } from "../lottery.award/lottery.award.module";
import { LotteryAward } from "../lottery.award/lottery.award.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { ScheduleModule } from "@nestjs/schedule";
import { SysConfig } from "../sys.config/sys.config.entity";
import { User } from "../user/user.entity";
import { LotteryRequest } from "../lottery.request/lottery.request.entity";
import { LotteryFtQueue } from "../lottery.request/lottery.ft.queue";
import { ConnectModule } from "../connect/connect.module";
import { OrderRequestModule } from "../order.request/order.request.module";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([LotteryAward, SysConfig, User, LotteryRequest, LotteryFtQueue,]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
    OrderRequestModule,
    JwtModule.register({}),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule { }
