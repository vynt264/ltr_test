import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Game } from "./game.entity";
import { BacklistModule } from "../../backlist/backlist.module";
import { UserModule } from "../../user/user.module";
import { AdminGameController } from "./admin.game.controller";
import { AdminGameService } from "./admin.game.service";
import { SysConfigsModule } from "../../sys.config/sys.config.module";
import { ConnectModule } from "../../connect/connect.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../../maintenance/maintenance.module";
import { ValidateRightsModule } from "../../admin/validate-rights/validate-rights.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    JwtModule.register({}),
    MaintenanceModule,
    ValidateRightsModule,
  ],
  controllers: [AdminGameController],
  providers: [AdminGameService],
})
export class AdminGameModule {}
