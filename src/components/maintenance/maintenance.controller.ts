import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put, Inject, BadRequestException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AuthAdminGuard } from '../auth/guards/auth-admin.guard';
import { Logger } from 'winston';

@Controller('api/v1/maintenance')
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  @Post()
  @UseGuards(AuthAdminGuard)
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    try {
      return this.maintenanceService.create(createMaintenanceDto);
    } catch (err) {
      this.logger.error(`${MaintenanceController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get()
  @UseGuards(AuthAdminGuard)
  findAll() {
    try {
      return this.maintenanceService.findAll();
    } catch (error) {
      this.logger.error(`${MaintenanceController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  @UseGuards(AuthAdminGuard)
  findOne(@Param('id') id: string) {
    try {
      return this.maintenanceService.findOne(+id);
    } catch (error) {
      this.logger.error(`${MaintenanceController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Put(':id')
  @UseGuards(AuthAdminGuard)
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    try {
      return this.maintenanceService.update(+id, updateMaintenanceDto);
    } catch (error) {
      this.logger.error(`${MaintenanceController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  @UseGuards(AuthAdminGuard)
  remove(@Param('id') id: string) {
    try {
      return this.maintenanceService.remove(+id);
    } catch (error) {
      this.logger.error(`${MaintenanceController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
