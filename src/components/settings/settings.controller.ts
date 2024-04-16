import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, BadRequestException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Logger } from 'winston';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  @Post()
  create(@Body() createSettingDto: CreateSettingDto) {
    try {
      return this.settingsService.create(createSettingDto);
    } catch (err) {
      this.logger.error(`${SettingsController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get()
  findAll() {
    try {
      return this.settingsService.findAll();
    } catch (error) {
      this.logger.error(`${SettingsController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.settingsService.findOne(+id);
    } catch (error) {
      this.logger.error(`${SettingsController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSettingDto: UpdateSettingDto) {
    try {
      return this.settingsService.update(+id, updateSettingDto);
    } catch (error) {
      this.logger.error(`${SettingsController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.settingsService.remove(+id);
    } catch (error) {
      this.logger.error(`${SettingsController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
