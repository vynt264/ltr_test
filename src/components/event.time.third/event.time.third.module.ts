import { BacklistModule } from "../backlist/backlist.module";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventTime } from "./event.time.third.entity";
import { EventTimeController } from "./event.time.third.controller";
import { EventTimeService } from "./event.time.third.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [TypeOrmModule.forFeature([EventTime]), BacklistModule, UserModule],
  controllers: [EventTimeController],
  providers: [EventTimeService],
  exports: [EventTimeService],
})
export class EventTimeModule {}
