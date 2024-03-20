import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoinWallet } from "./coin.wallet.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { CoinWalletController } from "./coin.wallet.controller";
import { CoinWalletService } from "./coin.wallet.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { CoinWalletHistoryModule } from "../coin.wallet.history/coin.wallet.history.module";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CoinWallet]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    CoinWalletHistoryModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [CoinWalletController],
  providers: [CoinWalletService],
})
export class CoinWalletModule {}
