import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserInfo } from "./user.info.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { UserInfoController } from "./user.info.controller";
import { UserInfoService } from "./user.info.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { User } from "../user/user.entity";
import { OrderRequestModule } from "../order.request/order.request.module";
import { UploadMiddleware } from "src/system/middleware/upload.middleware";
import { MulterModule } from "@nestjs/platform-express";
import { UploadS3Module } from "../upload.s3/upload.s3.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserInfo]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    OrderRequestModule,
    UploadS3Module,
    MulterModule.registerAsync({
      useClass: UploadMiddleware,
    }),
  ],
  controllers: [UserInfoController],
  providers: [UserInfoService],
})
export class UserInfoModule {}
