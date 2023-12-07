import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BacklistModule } from "../backlist/backlist.module";
import { ConnectModule } from "../connect/connect.module";
import { SubWalletCodeQueue } from "../subwallet/sub.wallet.code.queue";
import { SubWallet } from "../subwallet/sub.wallet.entity";
import { SubWalletHistory } from "../subwallet/sub.wallet.history.entity";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { User } from "../user/user.entity";
import { UserModule } from "../user/user.module";
import { Wallet } from "../wallet/wallet.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { TransactionController } from "./transaction.controller";
import { Transaction } from "./transaction.entity";
import { TransFtQueue } from "./transaction.ft.queue";
import { TransactionService } from "./transaction.service";
import { LockModule } from "src/system/lock/lock.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      SysConfig,
      User,
      Wallet,
      TransFtQueue,
      SubWallet,
      SubWalletCodeQueue,
      WalletHistory,
      SubWalletHistory,
    ]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    LockModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
