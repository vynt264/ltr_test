import { Module, forwardRef } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/components/orders/entities/order.entity';
import { PlayHistoryHilo } from '../admin.hilo/entities/play.history.hilo.entity';
import { PlayHistoryPoker } from '../admin.poker/entities/play.history.poker.entity';
import { PlayHistoryKeno } from '../admin.keno/entities/play.history.keno.entity';
import { User } from 'src/components/user/user.entity';
import { BookmakerModule } from '../bookmaker/bookmaker.module';
import { AdminUserModule } from '../admin.user/admin.user.module';
import { UserModule } from 'src/components/user/user.module';
import { ValidateRightsModule } from '../validate-rights/validate-rights.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, PlayHistoryHilo, PlayHistoryPoker, PlayHistoryKeno, User]),
    JwtModule.register({}),
    forwardRef(() => BookmakerModule),
    forwardRef(() => UserModule),
    forwardRef(() => ValidateRightsModule),
  ],
  controllers: [StatisticController],
  providers: [StatisticService]
})
export class StatisticModule {}
