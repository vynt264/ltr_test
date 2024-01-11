import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { HoldingNumbersService } from './holding-numbers.service';
import { HoldingNumbersController } from './holding-numbers.controller';
import { HoldingNumber } from './entities/holding-number.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HoldingNumber]),
  ],
  controllers: [HoldingNumbersController],
  providers: [HoldingNumbersService],
  exports: [HoldingNumbersService]
})
export class HoldingNumbersModule {}
