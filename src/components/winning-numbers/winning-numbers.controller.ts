import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WinningNumbersService } from './winning-numbers.service';
import { CreateWinningNumberDto } from './dto/create-winning-number.dto';
import { UpdateWinningNumberDto } from './dto/update-winning-number.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';

@Controller('api/v1/winning-numbers')
export class WinningNumbersController {
  constructor(private readonly winningNumbersService: WinningNumbersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  create(@Body() createWinningNumberDto: CreateWinningNumberDto) {
    return this.winningNumbersService.create(createWinningNumberDto);
  }

  @Get()
  findAll() {
    return this.winningNumbersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.winningNumbersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWinningNumberDto: UpdateWinningNumberDto) {
    return this.winningNumbersService.update(+id, updateWinningNumberDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.winningNumbersService.remove(+id);
  }
}
