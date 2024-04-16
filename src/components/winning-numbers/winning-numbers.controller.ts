import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject, BadRequestException } from '@nestjs/common';
import { WinningNumbersService } from './winning-numbers.service';
import { CreateWinningNumberDto } from './dto/create-winning-number.dto';
import { UpdateWinningNumberDto } from './dto/update-winning-number.dto';
import { BacklistGuard } from '../backlist/backlist.guard';
import { Roles } from '../auth/roles.guard/roles.decorator';
import { UserRoles } from '../user/enums/user.enum';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Logger } from 'winston';

@Controller('api/v1/winning-numbers')
export class WinningNumbersController {
  constructor(
    private readonly winningNumbersService: WinningNumbersService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  @Post()
  @UseGuards(AuthGuard, BacklistGuard)
  create(@Body() createWinningNumberDto: CreateWinningNumberDto) {
    try {
      return this.winningNumbersService.create(createWinningNumberDto);
    } catch (error) {
      this.logger.error(`${WinningNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get()
  findAll() {
    try {
      return this.winningNumbersService.findAll();
    } catch (error) {
      this.logger.error(`${WinningNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.winningNumbersService.findOne(+id);
    } catch (error) {
      this.logger.error(`${WinningNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWinningNumberDto: UpdateWinningNumberDto) {
    try {
      return this.winningNumbersService.update(+id, updateWinningNumberDto);
    } catch (error) {
      this.logger.error(`${WinningNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  remove(@Param('id') id: string) {
    try {
      return this.winningNumbersService.remove(+id);
    } catch (error) {
      this.logger.error(`${WinningNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
