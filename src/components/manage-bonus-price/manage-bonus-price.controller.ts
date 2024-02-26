import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import { ManageBonusPriceService } from './manage-bonus-price.service';
import { CreateManageBonusPriceDto } from './dto/create-manage-bonus-price.dto';
import { UpdateManageBonusPriceDto } from './dto/update-manage-bonus-price.dto';
import { Logger } from 'winston';

@Controller('/api/v1/manage-bonus-price')
export class ManageBonusPriceController {
  constructor(
    private readonly manageBonusPriceService: ManageBonusPriceService,
    @Inject("winston")
    private readonly logger: Logger,
  ) {}

  @Post()
  async create(@Body() createManageBonusPriceDto: CreateManageBonusPriceDto) {
    try {
      return await this.manageBonusPriceService.create(createManageBonusPriceDto);
    } catch (error) {
      this.logger.error(`${ManageBonusPriceController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.manageBonusPriceService.findAll();
    } catch (error) {
      this.logger.error(`${ManageBonusPriceController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.manageBonusPriceService.findOne(+id);
    } catch (error) {
      this.logger.error(`${ManageBonusPriceController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateManageBonusPriceDto: UpdateManageBonusPriceDto) {
    try {
      return await this.manageBonusPriceService.update(+id, updateManageBonusPriceDto);
    } catch (error) {
      this.logger.error(`${ManageBonusPriceController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.manageBonusPriceService.remove(+id);
    } catch (error) {
      this.logger.error(`${ManageBonusPriceController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }
}
