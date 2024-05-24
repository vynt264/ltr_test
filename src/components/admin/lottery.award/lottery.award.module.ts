import { Module, forwardRef } from '@nestjs/common';
import { LotteryAwardService } from './lottery.award.service';
import { LotteryAwardController } from './lottery.award.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryAward } from './entities/lottery.award.entity';
import { JwtModule } from '@nestjs/jwt';
import { Order } from 'src/components/orders/entities/order.entity';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LotteryAward,
      Order
    ]),
    JwtModule.register({}),
    forwardRef(() => ValidateRightsModule),
  ],
  controllers: [LotteryAwardController],
  providers: [LotteryAwardService]
})
export class LotteryAwardModule {}
