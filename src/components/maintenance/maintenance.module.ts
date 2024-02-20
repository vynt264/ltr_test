import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Maintenance } from './entities/maintenance.entity';
import { BacklistModule } from '../backlist/backlist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance]),
    BacklistModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService]
})
export class MaintenanceModule {}
