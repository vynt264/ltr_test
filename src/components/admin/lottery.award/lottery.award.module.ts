import { Module } from '@nestjs/common';
import { LotteryAwardService } from './lottery.award.service';
import { LotteryAwardController } from './lottery.award.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryAward } from './entities/lottery.award.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LotteryAward
    ]),
    JwtModule.register({}),
  ],
  controllers: [LotteryAwardController],
  providers: [LotteryAwardService]
})
export class LotteryAwardModule {}
