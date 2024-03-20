import { Module } from "@nestjs/common";
import { APIModule } from "./api.third/api.third.module";
import { AuthModule } from "./auth/auth.module";
import { BacklistModule } from "./backlist/backlist.module";
// import { EventTimeModule } from "./event.time.third/event.time.third.module";
import { LotteryAwardModule } from "./lottery.award/lottery.award.module";
import { PermissionModule } from "./permission/permission.module";
import { SysConfigsModule } from "./sys.config/sys.config.module";
import { UserHistoryModule } from "./user.history/user.history.module";
import { UserModule } from "./user/user.module";
// import { LotteryRequestModule } from "./lottery.request/lottery.request.module";
import { GameModule } from "./game/game.module";
import { NewQueryModule } from "./new.query/new.quey.module";
import { OrdersModule } from './orders/orders.module';
import { GatewayModule } from './gateway/gateway.module';
import { ScheduleModule } from './schedule/schedule.module';
import { GameTextModule } from "./game.text/game.text.module";
import { CommonModule } from "./common/common.module";
import { QaModule } from "./qa/qa.module";
import { BookMakerModule } from "./bookmaker/bookmaker.module";
import { WalletModule } from "./wallet/wallet.module";
import { UserInfoModule } from "./user.info/user.info.module";
import { PromotionModule } from "./promotion/promotion.module";
import { PromotionHistoriesModule } from "./promotion.history/promotion.history.module";
import { CoinWalletModule } from "./coin.wallet/coin.wallet.module";
import { CoinWalletHistoryModule } from "./coin.wallet.history/coin.wallet.history.module";
import { SysLayoutModule } from "./sys.layout/sys.layout.module";
import { WalletHandlerModule } from './wallet-handler/wallet-handler.module';
import { AnalyticsModule } from "./analytics/analytics.module";
import { AdminOrdersModule } from "./admin.orders/admin.orders.module";
import { WinningNumbersModule } from './winning-numbers/winning-numbers.module';
import { WalletInoutModule } from "./wallet.inout/wallet.inout.module";
import { HoldingNumbersModule } from './holding-numbers/holding-numbers.module';
import { AdminDashboardModule } from "./admin.dashboard/admin.dashboard.module";
import { IntegrationModule } from "./integration/integraion.module";
import { ManageBonusPriceModule } from './manage-bonus-price/manage-bonus-price.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AdminPokerModule } from "./admin.poker/admin.poker.module";
import { AdminHiloModule } from "./admin.hilo/admin.hilo.module";
import { SettingsModule } from './settings/settings.module';
import { TokensModule } from './tokens/tokens.module';
@Module({
  imports: [
    AuthModule,
    PermissionModule,
    UserModule,
    BacklistModule,
    APIModule,
    UserHistoryModule,
    // EventTimeModule,
    SysConfigsModule,
    LotteryAwardModule,
    // LotteryRequestModule,
    GameModule,
    NewQueryModule,
    OrdersModule,
    GatewayModule,
    ScheduleModule,
    GameTextModule,
    CommonModule,
    QaModule,
    BookMakerModule,
    WalletModule,
    UserInfoModule,
    PromotionModule,
    PromotionHistoriesModule,
    CoinWalletModule,
    CoinWalletHistoryModule,
    SysLayoutModule,
    WalletHandlerModule,
    AnalyticsModule,
    AdminOrdersModule,
    WinningNumbersModule,
    WalletInoutModule,
    HoldingNumbersModule,
    AdminDashboardModule,
    IntegrationModule,
    ManageBonusPriceModule,
    MaintenanceModule,
    AdminPokerModule,
    AdminHiloModule,
    SettingsModule,
    TokensModule,
    MaintenanceModule
  ],
})
export class MainModule { }
