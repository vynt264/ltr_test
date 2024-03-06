import { BacklistModule } from "../backlist/backlist.module";
import { UserController } from "./user.controller";
import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Wallet } from "../wallet/wallet.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { WalletCodeQueue } from "../wallet/wallet.code.queue";
import { UserInfo } from "../user.info/user.info.entity";
import { JwtModule } from "@nestjs/jwt";
@Module({
  imports: [
    BacklistModule,
    TypeOrmModule.forFeature([User, Wallet, WalletHistory, WalletCodeQueue, UserInfo]),
    JwtModule.register({}),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
