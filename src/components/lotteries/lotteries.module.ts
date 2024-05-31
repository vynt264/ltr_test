import { Module, forwardRef } from '@nestjs/common';
import { LotteriesService } from './lotteries.service';
import { LotteriesController } from './lotteries.controller';
import { ManageBonusPriceModule } from '../manage-bonus-price/manage-bonus-price.module';
import { SettingsModule } from '../settings/settings.module';
import { OrdersModule } from '../orders/orders.module';
import { BonusSettingModule } from '../bonus-setting/bonus-setting.module';
import { RedisCacheModule } from 'src/system/redis/redis.module';

@Module({
  imports: [
    forwardRef(() => ManageBonusPriceModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => BonusSettingModule),
    forwardRef(() => SettingsModule),
    forwardRef(() => RedisCacheModule),
  ],
  controllers: [LotteriesController],
  providers: [LotteriesService],
  exports: [LotteriesService],
})
export class LotteriesModule {}
