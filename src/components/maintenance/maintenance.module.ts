import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Maintenance } from './entities/maintenance.entity';
import { BacklistModule } from '../backlist/backlist.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    BacklistModule,
    JwtModule.register({}),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
