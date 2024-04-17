import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayHistoryKeno } from "../admin.keno/entities/play.history.keno.entity";
import { SysConfigKeno } from "../admin.keno/entities/sys.config.keno.entity";
import { AdminKenoController } from "./admin.keno.controller";
import { AdminKenoService } from "./admin.keno.service";
import { BacklistModule } from "../../backlist/backlist.module";
import { UserModule } from "../../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayHistoryKeno, SysConfigKeno]),
    BacklistModule,
    UserModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [AdminKenoController],
  providers: [AdminKenoService],
})
export class AdminKenoModule {}
