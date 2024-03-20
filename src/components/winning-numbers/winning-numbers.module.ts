import { Module } from '@nestjs/common';
import { WinningNumbersService } from './winning-numbers.service';
import { WinningNumbersController } from './winning-numbers.controller';
import { BacklistModule } from '../backlist/backlist.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinningNumber } from './entities/winning-number.entity';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WinningNumber]),
    BacklistModule,
    JwtModule.register({}),
    UserModule,
    MaintenanceModule
  ],
  controllers: [WinningNumbersController],
  providers: [WinningNumbersService],
  exports: [WinningNumbersService]
})
export class WinningNumbersModule {}
