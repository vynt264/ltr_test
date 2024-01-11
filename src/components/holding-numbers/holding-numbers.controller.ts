import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HoldingNumbersService } from './holding-numbers.service';
import { CreateHoldingNumberDto } from './dto/create-holding-number.dto';
import { UpdateHoldingNumberDto } from './dto/update-holding-number.dto';

@Controller('holding-numbers')
export class HoldingNumbersController {
  constructor(private readonly holdingNumbersService: HoldingNumbersService) {}

  @Post()
  create(@Body() createHoldingNumberDto: CreateHoldingNumberDto) {
    return this.holdingNumbersService.create(createHoldingNumberDto);
  }

  @Get()
  findAll() {
    return this.holdingNumbersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holdingNumbersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHoldingNumberDto: UpdateHoldingNumberDto) {
    return this.holdingNumbersService.update(+id, updateHoldingNumberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holdingNumbersService.remove(+id);
  }
}
