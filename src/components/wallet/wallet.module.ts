import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Wallet } from "./wallet.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { User } from "../user/user.entity";
import { WalletHistory } from "./wallet.history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, SysConfig, User, WalletHistory]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
