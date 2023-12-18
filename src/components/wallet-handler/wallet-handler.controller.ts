import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { WalletHandlerService } from './wallet-handler.service';
import { CreateWalletHandlerDto } from './dto/create-wallet-handler.dto';
import { UpdateWalletHandlerDto } from './dto/update-wallet-handler.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';

@Controller('api/v1/wallet-handler')
export class WalletHandlerController {
  constructor(private readonly walletHandlerService: WalletHandlerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  create(@Body() createWalletHandlerDto: CreateWalletHandlerDto) {
    return this.walletHandlerService.create(createWalletHandlerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findAll() {
    return this.walletHandlerService.findAll();
  }

  @Get('user')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findWalletByUserId(@Request() req: any) {
    return this.walletHandlerService.findWalletByUserId(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findOne(@Param('id') id: string) {
    return this.walletHandlerService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  update(@Param('id') id: string, @Body() updateWalletHandlerDto: UpdateWalletHandlerDto) {
    return this.walletHandlerService.update(+id, updateWalletHandlerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  remove(@Param('id') id: string) {
    return this.walletHandlerService.remove(+id);
  }
}
