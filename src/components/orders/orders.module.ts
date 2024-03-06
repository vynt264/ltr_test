import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderRequest } from '../order.request/order.request.entity';
import { User } from '../user/user.entity';
import { SysConfig } from '../sys.config/sys.config.entity';
import { OrderCodeQueue } from '../order.request/order.code.queue';
import { OrderRequestHis } from '../order.request/order.request.his.entity';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderRequest, SysConfig, User, OrderRequestHis, OrderCodeQueue, WalletHistory]),
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
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
