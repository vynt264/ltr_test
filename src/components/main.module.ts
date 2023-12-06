import { Module } from "@nestjs/common";
import { APIModule } from "./api.third/api.third.module";
import { AuthModule } from "./auth/auth.module";
import { BacklistModule } from "./backlist/backlist.module";
import { EventTimeModule } from "./event.time.third/event.time.third.module";
import { LotteryAwardModule } from "./lottery.award/lottery.award.module";
import { PermissionModule } from "./permission/permission.module";
import { SysConfigsModule } from "./sys.config/sys.config.module";
import { UserHistoryModule } from "./user.history/user.history.module";
import { UserModule } from "./user/user.module";
import { LotteryRequestModule } from "./lottery.request/lottery.request.module";
import { GameModule } from "./game/game.module";
import { NewQueryModule } from "./new.query/new.quey.module";
import { OrdersModule } from './orders/orders.module';
import { GatewayModule } from './gateway/gateway.module';
import { ScheduleModule } from './schedule/schedule.module';
@Module({
  imports: [
    AuthModule,
    PermissionModule,
    UserModule,
    BacklistModule,
    APIModule,
    UserHistoryModule,
    EventTimeModule,
    SysConfigsModule,
    LotteryAwardModule,
    LotteryRequestModule,
    GameModule,
    NewQueryModule,
    OrdersModule,
    GatewayModule,
    ScheduleModule,
  ],
})
export class MainModule {}
