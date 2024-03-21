import { Module } from '@nestjs/common';
import { ManageBonusPriceService } from './manage-bonus-price.service';
import { ManageBonusPriceController } from './manage-bonus-price.controller';
import { ManageBonusPrice } from './entities/manage-bonus-price.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookMakerModule } from '../bookmaker/bookmaker.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([ManageBonusPrice]),
    BookMakerModule
  ],
  controllers: [ManageBonusPriceController],
  providers: [ManageBonusPriceService],
  exports: [ManageBonusPriceService],
})
export class ManageBonusPriceModule {}
