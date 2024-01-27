import { Module } from '@nestjs/common';
import { LotteriesService } from './lotteries.service';
import { LotteriesController } from './lotteries.controller';
import { ManageBonusPriceModule } from '../manage-bonus-price/manage-bonus-price.module';

@Module({
  imports: [
    ManageBonusPriceModule
  ],
  controllers: [LotteriesController],
  providers: [LotteriesService],
  exports: [LotteriesService],
})
export class LotteriesModule {}
