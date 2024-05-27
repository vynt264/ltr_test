import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Qa } from "./qa.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { QaController } from "./qa.controller";
import { QaService } from "./qa.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";
import { ValidateRightsModule } from "../admin/validate-rights/validate-rights.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Qa]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    JwtModule.register({}),
    MaintenanceModule,
    ValidateRightsModule,
  ],
  controllers: [QaController],
  providers: [QaService],
})
export class QaModule {}
