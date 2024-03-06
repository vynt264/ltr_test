import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromotionHistories } from "./promotion.history.entity";
import { BacklistModule } from "../backlist/backlist.module";
import { UserModule } from "../user/user.module";
import { PromotionHistoriesController } from "./promotion.history.controller";
import { PromotionHistoriesService } from "./promotion.history.service";
import { SysConfig } from "../sys.config/sys.config.entity";
import { SysConfigsModule } from "../sys.config/sys.config.module";
import { ConnectModule } from "../connect/connect.module";
import { PromotionModule } from "../promotion/promotion.module";
import { CoinWalletHistories } from "../coin.wallet.history/coin.wallet.history.entiry";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    TypeOrmModule.forFeature([PromotionHistories, CoinWalletHistories]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    PromotionModule,
    JwtModule.register({}),
  ],
  controllers: [PromotionHistoriesController],
  providers: [PromotionHistoriesService],
})
export class PromotionHistoriesModule {}
