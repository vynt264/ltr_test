import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Inject, BadRequestException } from '@nestjs/common';
import { WalletHandlerService } from './wallet-handler.service';
import { CreateWalletHandlerDto } from './dto/create-wallet-handler.dto';
import { UpdateWalletHandlerDto } from './dto/update-wallet-handler.dto';
import { BacklistGuard } from '../backlist/backlist.guard';
import { Roles } from '../auth/roles.guard/roles.decorator';
import { UserRoles } from '../user/enums/user.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Logger } from 'winston';

@Controller('api/v1/wallet-handler')
export class WalletHandlerController {
  constructor(
    private readonly walletHandlerService: WalletHandlerService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  @Post()
  @UseGuards(AuthGuard, BacklistGuard)
  create(@Body() createWalletHandlerDto: CreateWalletHandlerDto) {
    try {
      return this.walletHandlerService.create(createWalletHandlerDto);
    } catch (error) {
      this.logger.error(`${WalletHandlerController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get('user')
  @UseGuards(AuthGuard, BacklistGuard)
  findWalletByUserId(@Request() req: any) {
    try {
      return this.walletHandlerService.findWalletByUserIdFromRedis(req.user.id);
    } catch (error) {
      this.logger.error(`${WalletHandlerController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  findOne(@Param('id') id: string) {
    try {
      return this.walletHandlerService.findOne(+id);
    } catch (error) {
      this.logger.error(`${WalletHandlerController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Patch(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  update(@Param('id') id: string, @Body() updateWalletHandlerDto: UpdateWalletHandlerDto) {
    try {
      return this.walletHandlerService.update(+id, updateWalletHandlerDto);
    } catch (error) {
      this.logger.error(`${WalletHandlerController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  remove(@Param('id') id: string) {
    try {
      return this.walletHandlerService.remove(+id);
    } catch (error) {
      this.logger.error(`${WalletHandlerController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
