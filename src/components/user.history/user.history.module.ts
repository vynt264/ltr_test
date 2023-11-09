import { UserModule } from "./../user/user.module";
import { BacklistModule } from "../backlist/backlist.module";
import { Device } from "./../device/device.entity";
import { User } from "../../components/user/user.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserHistory } from "./user.history.entity";
import { UserHistoryController } from "./user.history.controller";
import { UserHistoryService } from "./user.history.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserHistory, User, Device]),
    BacklistModule,
    UserModule,
  ],
  controllers: [UserHistoryController],
  providers: [UserHistoryService],
  exports: [UserHistoryService],
})
export class UserHistoryModule {}
