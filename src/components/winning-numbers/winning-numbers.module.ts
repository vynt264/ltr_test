import { Module } from '@nestjs/common';
import { WinningNumbersService } from './winning-numbers.service';
import { WinningNumbersController } from './winning-numbers.controller';
import { BacklistModule } from '../backlist/backlist.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinningNumber } from './entities/winning-number.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WinningNumber]),
    BacklistModule
  ],
  controllers: [WinningNumbersController],
  providers: [WinningNumbersService],
  exports: [WinningNumbersService]
})
export class WinningNumbersModule {}
