import { Module } from '@nestjs/common';
import { WalletHandlerService } from './wallet-handler.service';
import { WalletHandlerController } from './wallet-handler.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { BacklistModule } from '../backlist/backlist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    BacklistModule,
  ],
  controllers: [WalletHandlerController],
  providers: [WalletHandlerService],
  exports: [WalletHandlerService],
})
export class WalletHandlerModule {}
