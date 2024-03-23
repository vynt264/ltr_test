import { Module } from '@nestjs/common';
import { BookmakerModule } from './bookmaker/bookmaker.module';
import { AdminDashboardModule } from './admin.dashboard/admin.dashboard.module';
import { AdminOrdersModule } from './admin.orders/admin.orders.module';
import { AdminHiloModule } from './admin.hilo/admin.hilo.module';
import { AdminPokerModule } from './admin.poker/admin.poker.module';
import { LotteryAwardModule } from './lottery.award/lottery.award.module';
import { AdminUserModule } from './admin.user/admin.user.module';
import { GuardsModule } from './guards/guards.module';

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
    ],
})
export class AdminModule {}
