import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { LotteriesModule } from 'src/lotteries/lotteries.module';
import { GatewayModule } from '../gateway/gateway.module';
import { BookMakerModule } from '../bookmaker/bookmaker.module';
import { OrdersModule } from '../orders/orders.module';
import { WalletHandlerModule } from '../wallet-handler/wallet-handler.module';
import { LotteryAwardModule } from '../lottery.award/lottery.award.module';

@Module({
    imports: [
        RedisCacheModule,
        LotteriesModule,
        GatewayModule,
        BookMakerModule,
        OrdersModule,
        WalletHandlerModule,
        LotteryAwardModule,
    ],
    providers: [
        ScheduleService,
    ],
    exports: [
        ScheduleModule,
        ScheduleService,
    ],
})
export class ScheduleModule { }
