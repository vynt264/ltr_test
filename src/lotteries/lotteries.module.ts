import { Module } from '@nestjs/common';
import { LotteriesService } from './lotteries.service';
import { LotteriesController } from './lotteries.controller';

@Module({
  controllers: [LotteriesController],
  providers: [LotteriesService]
})
export class LotteriesModule {}
