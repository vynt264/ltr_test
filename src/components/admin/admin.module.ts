import { Module } from '@nestjs/common';
import { BookmakerModule } from './bookmaker/bookmaker.module';
import { AdminDashboardModule } from './admin.dashboard/admin.dashboard.module';
import { AdminOrdersModule } from './admin.orders/admin.orders.module';
import { AdminHiloModule } from './admin.hilo/admin.hilo.module';
import { AdminPokerModule } from './admin.poker/admin.poker.module';
import { LotteryAwardModule } from './lottery.award/lottery.award.module';
import { AdminUserModule } from './admin.user/admin.user.module';
import { GuardsModule } from './guards/guards.module';
import { SettingModule } from './setting/setting.module';
import { AdminKenoModule } from './admin.keno/admin.keno.module';
import { BonusSettingModule } from './bonus-setting/bonus-setting.module';

@Module({
    imports: [
        BookmakerModule,
        AdminDashboardModule,
        AdminOrdersModule,
        AdminHiloModule,
        AdminPokerModule,
        LotteryAwardModule,
        AdminUserModule,
        GuardsModule,
        SettingModule,
        AdminKenoModule,
        BonusSettingModule,
    ],
})
export class AdminModule {}
