import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { LotteriesModule } from 'src/lotteries/lotteries.module';
import { GatewayModule } from '../gateway/gateway.module';
import { BookMakerModule } from '../bookmaker/bookmaker.module';
import { OrdersModule } from '../orders/orders.module';
import { WalletHandlerModule } from '../wallet-handler/wallet-handler.module';
import { LotteryAwardModule } from '../lottery.award/lottery.award.module';
import { WinningNumbersModule } from '../winning-numbers/winning-numbers.module';
import { HoldingNumbersModule } from '../holding-numbers/holding-numbers.module';
import { WalletHistory } from '../wallet/wallet.history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    
    imports: [
        TypeOrmModule.forFeature([WalletHistory]),
        RedisCacheModule,
        LotteriesModule,
        GatewayModule,
        BookMakerModule,
        OrdersModule,
        WalletHandlerModule,
        LotteryAwardModule,
        WinningNumbersModule,
        HoldingNumbersModule,
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
