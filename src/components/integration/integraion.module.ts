import { Module } from "@nestjs/common";
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
    ]),
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService],
})
export class IntegrationModule {}
