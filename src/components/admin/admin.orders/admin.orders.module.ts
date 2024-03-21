import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../../backlist/backlist.module";
import { UserModule } from "../../user/user.module";
import { AdminOrdersController } from "./admin.orders.controller";
import { AdminOrdersService } from "./admin.orders.service";
import { SysConfigsModule } from "../../sys.config/sys.config.module";
import { ConnectModule } from "../../connect/connect.module";
import { Order } from "../../orders/entities/order.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { LotteryAwardModule } from "../../lottery.award/lottery.award.module";
import { User } from "../../user/user.entity";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
    LotteryAwardModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}
