import { User } from "../../components/user/user.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { SysConfigsController } from "./sys.config.controller";
import { SysConfig } from "./sys.config.entity";
import { SysConfigsService } from "./sys.config.service";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SysConfig, User]),
    BacklistModule,
    UserModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [SysConfigsController],
  providers: [SysConfigsService],
})
export class SysConfigsModule {}
