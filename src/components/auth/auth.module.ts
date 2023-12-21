import { UserHistoryModule } from "../user.history/user.history.module";
import { ConnectModule } from "../connect/connect.module";
import { BacklistModule } from "../backlist/backlist.module";
import { RtStrategy } from "./rt/rt.strategy";
import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { LocalStrategy } from "./local.stratery/local.strategy";
import { UserModule } from "../user/user.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt/jwt.strategy";
import { User } from "src/components/user/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
// import { UserInfoModule } from "../user.info/user.info.module";
import { UserInfo } from "../user.info/user.info.entity";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";
import { WalletHandlerModule } from "../wallet-handler/wallet-handler.module";
import { RedisCacheModule } from "src/system/redis/redis.module";
@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserInfo, CoinWallet]),
    UserHistoryModule,
    UserModule,
    BacklistModule,
    ConnectModule,
    PassportModule,
    JwtModule.register({}),
    WalletHandlerModule,
    RedisCacheModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, RtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
