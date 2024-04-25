import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BonusSettingService } from './bonus-setting.service';
import { CreateBonusSettingDto } from './dto/create-bonus-setting.dto';
import { UpdateBonusSettingDto } from './dto/update-bonus-setting.dto';

@Controller('api/v1/admin-bonus-setting')
export class BonusSettingController {
  constructor(private readonly bonusSettingService: BonusSettingService) {}

  @Post()
  create(@Body() createBonusSettingDto: CreateBonusSettingDto) {
    return this.bonusSettingService.create(createBonusSettingDto);
  }

  @Get()
  findAll() {
    return this.bonusSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bonusSettingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBonusSettingDto: UpdateBonusSettingDto) {
    return this.bonusSettingService.update(+id, updateBonusSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bonusSettingService.remove(+id);
  }
}
