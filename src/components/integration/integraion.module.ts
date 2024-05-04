import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/user.entity";
import { Wallet } from "../wallet-handler/entities/wallet.entity";
import { BookMaker } from "../bookmaker/bookmaker.entity";
import { Exchange } from "./entities/exchange.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { WalletInout } from "../wallet.inout/wallet.inout.entity";
import { Order } from "../orders/entities/order.entity";
import { IntegrationService } from "./integration.service";
import { IntegrationController } from "./integration.controller";
import { UserInfo } from "../user.info/user.info.entity";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { PlayHistoryHilo } from '../admin/admin.hilo/entities/play.history.hilo.entity';
import { PlayHistoryPoker } from '../admin/admin.poker/entities/play.history.poker.entity';
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Wallet,
      BookMaker,
      Exchange,
      WalletHistory,
      WalletInout,
      Order,
      UserInfo,
      CoinWallet,
      PlayHistoryHilo,
      PlayHistoryPoker,
    ]),
    RedisCacheModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
})
export class IntegrationModule {}
