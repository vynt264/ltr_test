import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards } from '@nestjs/common';
import { WalletHandlerService } from './wallet-handler.service';
import { CreateWalletHandlerDto } from './dto/create-wallet-handler.dto';
import { UpdateWalletHandlerDto } from './dto/update-wallet-handler.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';
import { Roles } from '../auth/roles.guard/roles.decorator';
import { UserRoles } from '../user/enums/user.enum';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('api/v1/wallet-handler')
export class WalletHandlerController {
  constructor(private readonly walletHandlerService: WalletHandlerService) {}

  @Post()
  @UseGuards(AuthGuard, BacklistGuard)
  create(@Body() createWalletHandlerDto: CreateWalletHandlerDto) {
    return this.walletHandlerService.create(createWalletHandlerDto);
  }

  @Get('user')
  @UseGuards(AuthGuard, BacklistGuard)
  findWalletByUserId(@Request() req: any) {
    return this.walletHandlerService.findWalletByUserIdFromRedis(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  findOne(@Param('id') id: string) {
    return this.walletHandlerService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  update(@Param('id') id: string, @Body() updateWalletHandlerDto: UpdateWalletHandlerDto) {
    return this.walletHandlerService.update(+id, updateWalletHandlerDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  remove(@Param('id') id: string) {
    return this.walletHandlerService.remove(+id);
  }
}
