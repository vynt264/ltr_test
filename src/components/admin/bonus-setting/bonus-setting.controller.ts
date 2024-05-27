import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BonusSettingService } from './bonus-setting.service';
import { CreateBonusSettingDto } from './dto/create-bonus-setting.dto';
import { UpdateBonusSettingDto } from './dto/update-bonus-setting.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RIGHTS } from 'src/system/constants/rights';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';

@Controller('api/v1/admin-bonus-setting')
@UseGuards(AuthAdminGuard, RolesGuard)
export class BonusSettingController {
  constructor(private readonly bonusSettingService: BonusSettingService) {}

  @Post()
  @Roles(RIGHTS.CreateSettingXSNBonus)
  create(@Body() createBonusSettingDto: CreateBonusSettingDto) {
    return this.bonusSettingService.create(createBonusSettingDto);
  }

  @Get()
  @Roles(RIGHTS.ShowSettingXSNBonus)
  findAll() {
    return this.bonusSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bonusSettingService.findOne(+id);
  }

  @Patch(':id')
  @Roles(RIGHTS.EditSettingXSNBonus)
  update(@Param('id') id: string, @Body() updateBonusSettingDto: UpdateBonusSettingDto) {
    return this.bonusSettingService.update(+id, updateBonusSettingDto);
  }

  @Delete(':id')
  @Roles(RIGHTS.DeleteSettingXSNBonus)
  remove(@Param('id') id: string) {
    return this.bonusSettingService.remove(+id);
  }
}
