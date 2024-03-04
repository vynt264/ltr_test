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
import { WalletHistory } from "../wallet/wallet.history.entity";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletInout, WalletHistory]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    JwtModule.register({}),
  ],
  controllers: [WalletInoutController],
  providers: [WalletInoutService],
})
export class WalletInoutModule {}
