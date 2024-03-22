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
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LotteryAward,
      SysConfig,
      User,
    ]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [LotteryAwardController],
  providers: [LotteryAwardService],
  exports: [LotteryAwardService]
})
export class LotteryAwardModule {}
