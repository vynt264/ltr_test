import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlayHistoryHilo } from "./entities/play.history.hilo.entity";
import { SysConfigHilo } from "./entities/sys.config.hilo.entity";
import { AdminHiloController } from "./admin.hilo.controller";
import { AdminHiloService } from "./admin.hilo.service";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PlayHistoryHilo, SysConfigHilo]),
    BacklistModule,
    UserModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [AdminHiloController],
  providers: [AdminHiloService],
})
export class AdminHiloModule {}
