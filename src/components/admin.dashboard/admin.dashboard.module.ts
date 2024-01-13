import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { AdminDashboardController } from "./admin.dashboard.controller";
import { AdminDashboardService } from "./admin.dashboard.service";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { Order } from "../orders/entities/order.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { User } from "../user/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
