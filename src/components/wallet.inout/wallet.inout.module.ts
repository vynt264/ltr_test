import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletInout } from "./wallet.inout.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { WalletInoutController } from "./wallet.inout.controller";
import { WalletInoutService } from "./wallet.inout.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletInout]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [WalletInoutController],
  providers: [WalletInoutService],
})
export class WalletInoutModule {}
