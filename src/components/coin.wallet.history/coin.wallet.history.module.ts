import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CoinWalletHistories } from "./coin.wallet.history.entiry";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { CoinWalletHistoryController } from "./coin.wallet.history.controller";
import { CoinWalletHistoryService } from "./coin.wallet.history.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";
import { JwtModule } from "@nestjs/jwt";
import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CoinWalletHistories, CoinWallet]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    JwtModule.register({}),
    MaintenanceModule
  ],
  controllers: [CoinWalletHistoryController],
  providers: [CoinWalletHistoryService],
})
export class CoinWalletHistoryModule {}
