import { UserModule } from "./../user/user.module";
import { BacklistModule } from "../backlist/backlist.module";
import { Device } from "./../device/device.entity";
import { User } from "../../components/user/user.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserHistory } from "./user.history.entity";
import { UserHistoryController } from "./user.history.controller";
import { UserHistoryService } from "./user.history.service";
import { ScheduleModule } from "@nestjs/schedule";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserHistory, User, Device]),
    BacklistModule,
    UserModule,
    ScheduleModule.forRoot(),
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [UserHistoryController],
  providers: [UserHistoryService],
  exports: [UserHistoryService],
})
export class UserHistoryModule {}
