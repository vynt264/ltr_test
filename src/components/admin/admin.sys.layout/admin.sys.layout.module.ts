import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SysLayout } from "./sys.layout.entity";
import { BacklistModule } from "../../backlist/backlist.module";
import { UserModule } from "../../user/user.module";
import { AdminSysLayoutController } from "./admin.sys.layout.controller";
import { AdminSysLayoutService } from "./admin.sys.layout.service";
import { SysConfig } from "../../sys.config/sys.config.entity";
import { SysConfigsModule } from "../../sys.config/sys.config.module";
import { ConnectModule } from "../../connect/connect.module";
import { UploadMiddleware } from "src/system/middleware/upload.middleware";
import { MulterModule } from "@nestjs/platform-express";
import { UploadS3Module } from "../../upload.s3/upload.s3.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../../maintenance/maintenance.module";
import { ValidateRightsModule } from "../validate-rights/validate-rights.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([SysLayout]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    UploadS3Module,
    MulterModule.registerAsync({
      useClass: UploadMiddleware,
    }),
    JwtModule.register({}),
    MaintenanceModule,
    ValidateRightsModule,
  ],
  controllers: [AdminSysLayoutController],
  providers: [AdminSysLayoutService],
})
export class AdminSysLayoutModule {}
