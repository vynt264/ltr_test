import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/components/orders/entities/order.entity';
import { PlayHistoryHilo } from '../admin.hilo/entities/play.history.hilo.entity';
import { PlayHistoryPoker } from '../admin.poker/entities/play.history.poker.entity';
import { PlayHistoryKeno } from '../admin.keno/entities/play.history.keno.entity';
import { User } from 'src/components/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, PlayHistoryHilo, PlayHistoryPoker, PlayHistoryKeno, User]),
    JwtModule.register({}),
  ],
  controllers: [StatisticController],
  providers: [StatisticService]
})
export class StatisticModule {}
