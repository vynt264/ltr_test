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
import { StatisticModule } from './statistic/statistic.module';
import { RanksModule } from './ranks/ranks.module';
import { RolesModule } from './roles/roles.module';
import { ValidateRightsModule } from './validate-rights/validate-rights.module';
import { ManagementUserInfoModule } from './management-user-info/management-user-info.module';
import { AdminSysLayoutModule } from './admin.sys.layout/admin.sys.layout.module';
import { AdminGameModule } from './admin.game/admin.game.module';

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
        StatisticModule,
        RanksModule,
        RolesModule,
        ValidateRightsModule,
        ManagementUserInfoModule,
        AdminSysLayoutModule,
        AdminGameModule
    ],
})
export class AdminModule { }
