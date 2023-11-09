import { BacklistGuard } from "../backlist/backlist.guard";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Device } from "./device.entity";
import { DeviceController } from "./device.controller";
import { DeviceService } from "./device.service";

@Module({
  imports: [TypeOrmModule.forFeature([Device]), BacklistGuard],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
