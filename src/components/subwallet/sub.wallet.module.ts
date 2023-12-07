import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { ConnectModule } from "../connect/connect.module";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { User } from "../user/user.entity";
import { UserModule } from "../user/user.module";
import { SubWalletController } from "./sub.wallet.controller";
import { SubWallet } from "./sub.wallet.entity";
import { SubWalletHistory } from "./sub.wallet.history.entity";
import { SubWalletService } from "./sub.wallet.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([SubWallet, SysConfig, User, SubWalletHistory]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [SubWalletController],
  providers: [SubWalletService],
})
export class SubWalletModule {}
