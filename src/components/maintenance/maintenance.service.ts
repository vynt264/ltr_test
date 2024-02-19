import { Injectable } from '@nestjs/common';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Maintenance } from './entities/maintenance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
  ) { }

  create(createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceRepository.save(createMaintenanceDto);
  }

  async findAll() {
    const result = await this.maintenanceRepository.find();

    return result?.[0] || {};
  }

  findOne(id: number) {
    return this.maintenanceRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceRepository.update(id, updateMaintenanceDto);
  }

  remove(id: number) {
    return `This action removes a #${id} maintenance`;
  }
}
