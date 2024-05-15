import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from '../user/user.entity';
import { SysConfig } from '../sys.config/sys.config.entity';
import { BacklistModule } from '../backlist/backlist.module';
import { UserModule } from '../user/user.module';
import { SysConfigsModule } from '../sys.config/sys.config.module';
import { ConnectModule } from '../connect/connect.module';
import { Order } from './entities/order.entity';
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { GatewayModule } from '../gateway/gateway.module';
import { WalletHandlerModule } from '../wallet-handler/wallet-handler.module';
import { LotteryAwardModule } from '../lottery.award/lottery.award.module';
import { HoldingNumbersModule } from '../holding-numbers/holding-numbers.module';
import { WalletHistory } from '../wallet/wallet.history.entity';
import { LotteriesModule } from '../lotteries/lotteries.module';
import { WinningNumbersModule } from '../winning-numbers/winning-numbers.module';
import { JwtModule } from '@nestjs/jwt';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { RanksModule } from '../ranks/ranks.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      SysConfig,
      User,
      WalletHistory,
    ]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
    RedisCacheModule,
    GatewayModule,
    WalletHandlerModule,
    LotteryAwardModule,
    HoldingNumbersModule,
    LotteriesModule,
    WinningNumbersModule,
    JwtModule.register({}),
    MaintenanceModule,
    forwardRef(() => RanksModule),
    forwardRef(() => SettingsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
