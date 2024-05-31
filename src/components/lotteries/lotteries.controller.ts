import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LotteriesService } from './lotteries.service';
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import { OrderDto } from './dto/order.dto';

@Controller('/api/v1/lotteries')
export class LotteriesController {
  constructor(private readonly lotteriesService: LotteriesService) {}

  @Post("generate-prizes")
  generatePrizes(@Body("orders") orders: any) {
    const result = this.lotteriesService.generatePrizes(orders, 0);

    return result;
  }

  @Post()
  create(@Body() createLotteryDto: CreateLotteryDto) {
    return this.lotteriesService.create(createLotteryDto);
  }

  @Get()
  findAll() {
    return this.lotteriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lotteriesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLotteryDto: UpdateLotteryDto) {
    return this.lotteriesService.update(+id, updateLotteryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lotteriesService.remove(+id);
  }
}
