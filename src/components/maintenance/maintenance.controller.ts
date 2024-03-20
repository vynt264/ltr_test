import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthAdminGuard } from '../auth/guards/auth-admin.guard';

@Controller('api/v1/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  // @UseGuards(AuthGuard, BacklistGuard)
  @UseGuards(AuthAdminGuard)
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  // @UseGuards(AuthGuard, BacklistGuard)
  @UseGuards(AuthAdminGuard)
  findAll() {
    return this.maintenanceService.findAll();
  }

  @Get(':id')
  // @UseGuards(AuthGuard, BacklistGuard)
  @UseGuards(AuthAdminGuard)
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(+id);
  }

  @Put(':id')
  // @UseGuards(AuthGuard, BacklistGuard)
  @UseGuards(AuthAdminGuard)
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(+id, updateMaintenanceDto);
  }

  @Delete(':id')
  // @UseGuards(AuthGuard, BacklistGuard)
  @UseGuards(AuthAdminGuard)
  remove(@Param('id') id: string) {
    return this.maintenanceService.remove(+id);
  }
}
