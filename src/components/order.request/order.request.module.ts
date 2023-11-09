import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderRequest } from "./order.request.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { OrderRequestController } from "./order.request.controller";
import { OrderRequestService } from "./order.request.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { User } from "../user/user.entity";
import { OrderRequestHis } from "./order.request.his.entity";
import { OrderCodeQueue } from "./order.code.queue";

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRequest, SysConfig, User, OrderRequestHis, OrderCodeQueue]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [OrderRequestController],
  providers: [OrderRequestService],
  exports: [OrderRequestService],
})
export class OrderRequestModule {}
