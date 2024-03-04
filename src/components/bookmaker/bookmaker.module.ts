import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BookMaker } from "./bookmaker.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { BookMakerController } from "./bookmaker.controller";
import { BookMakerService } from "./bookmaker.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([BookMaker]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    JwtModule.register({}),
  ],
  controllers: [BookMakerController],
  providers: [BookMakerService],
  exports: [BookMakerService],
})
export class BookMakerModule {}
