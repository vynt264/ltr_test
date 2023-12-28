import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { AdminOrdersController } from "./admin.orders.controller";
import { AdminOrdersService } from "./admin.orders.service";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { Order } from "../orders/entities/order.entity";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}
