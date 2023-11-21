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

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderRequest, SysConfig, User, OrderRequestHis, OrderCodeQueue]),
    BacklistModule,
    UserModule,
    SysConfigsModule,
    ConnectModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
