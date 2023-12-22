import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { NewQueryController } from "./new.query.controller";
import { NewQueryService } from "./new.query.sevice";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { Order } from "../orders/entities/order.entity";
import { DataFake } from "./data.fake.entity";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    TypeOrmModule.forFeature([DataFake, Order]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [NewQueryController],
  providers: [NewQueryService],
})
export class NewQueryModule {}
