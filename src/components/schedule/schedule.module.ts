import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { LotteriesModule } from 'src/lotteries/lotteries.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
    imports: [
        RedisCacheModule,
        LotteriesModule,
        GatewayModule,
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
