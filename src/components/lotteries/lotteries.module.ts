import { Module, forwardRef } from '@nestjs/common';
import { LotteriesService } from './lotteries.service';
import { LotteriesController } from './lotteries.controller';
import { ManageBonusPriceModule } from '../manage-bonus-price/manage-bonus-price.module';
import { SettingsModule } from '../settings/settings.module';
import { OrdersModule } from '../orders/orders.module';
import { BonusSettingModule } from '../bonus-setting/bonus-setting.module';

@Module({
  imports: [
    ManageBonusPriceModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => BonusSettingModule),
    forwardRef(() => SettingsModule),
  ],
  controllers: [LotteriesController],
  providers: [LotteriesService],
  exports: [LotteriesService],
})
export class LotteriesModule {}
