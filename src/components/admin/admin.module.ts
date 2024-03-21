import { Module } from '@nestjs/common';
import { BookmakerModule } from './bookmaker/bookmaker.module';
import { AdminDashboardModule } from './admin.dashboard/admin.dashboard.module';
import { AdminOrdersModule } from './admin.orders/admin.orders.module';
import { AdminHiloModule } from './admin.hilo/admin.hilo.module';
import { AdminPokerModule } from './admin.poker/admin.poker.module';

@Module({
    imports: [
        BookmakerModule,
        AdminDashboardModule,
        AdminOrdersModule,
        AdminHiloModule,
        AdminPokerModule,
    ],
})
export class AdminModule {}
