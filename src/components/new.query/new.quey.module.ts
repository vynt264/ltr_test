import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { NewQueryController } from "./new.query.controller";
import { NewQueryService } from "./new.query.sevice";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { OrderRequestModule } from "../order.request/order.request.module";
import { OrderRequest } from "../order.request/order.request.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderRequest]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    OrderRequestModule,
  ],
  controllers: [NewQueryController],
  providers: [NewQueryService],
})
export class NewQueryModule {}
