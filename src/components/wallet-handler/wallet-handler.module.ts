import { Module } from '@nestjs/common';
import { WalletHandlerService } from './wallet-handler.service';
import { WalletHandlerController } from './wallet-handler.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { BacklistModule } from '../backlist/backlist.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { RedisCacheModule } from 'src/system/redis/redis.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    BacklistModule,
    JwtModule.register({}),
    UserModule,
    RedisCacheModule,
    MaintenanceModule
  ],
  controllers: [WalletHandlerController],
  providers: [WalletHandlerService],
  exports: [WalletHandlerService],
})
export class WalletHandlerModule {}
