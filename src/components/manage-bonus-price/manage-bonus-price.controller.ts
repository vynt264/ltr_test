import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ManageBonusPriceService } from './manage-bonus-price.service';
import { CreateManageBonusPriceDto } from './dto/create-manage-bonus-price.dto';
import { UpdateManageBonusPriceDto } from './dto/update-manage-bonus-price.dto';

@Controller('/api/v1/manage-bonus-price')
export class ManageBonusPriceController {
  constructor(private readonly manageBonusPriceService: ManageBonusPriceService) {}

  @Post()
  create(@Body() createManageBonusPriceDto: CreateManageBonusPriceDto) {
    return this.manageBonusPriceService.create(createManageBonusPriceDto);
  }

  @Get()
  findAll() {
    return this.manageBonusPriceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.manageBonusPriceService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateManageBonusPriceDto: UpdateManageBonusPriceDto) {
    return this.manageBonusPriceService.update(+id, updateManageBonusPriceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.manageBonusPriceService.remove(+id);
  }
}
