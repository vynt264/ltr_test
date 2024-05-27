import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SettingService } from './setting.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';
import { RIGHTS } from 'src/system/constants/rights';

@Controller('api/v1/admin-settings')
@UseGuards(AuthAdminGuard, RolesGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Post()
  @Roles(RIGHTS.EditSettingXSNCommon)
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingService.create(createSettingDto);
  }

  @Get()
  @Roles(RIGHTS.ShowSettingXSNCommon)
  findAll() {
    return this.settingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.settingService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RIGHTS.EditSettingXSNCommon)
  update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto) {
    return this.settingService.update(+id, updateSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.settingService.remove(+id);
  }
}
