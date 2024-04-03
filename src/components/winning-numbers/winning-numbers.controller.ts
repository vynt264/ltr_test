import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WinningNumbersService } from './winning-numbers.service';
import { CreateWinningNumberDto } from './dto/create-winning-number.dto';
import { UpdateWinningNumberDto } from './dto/update-winning-number.dto';
import { BacklistGuard } from '../backlist/backlist.guard';
import { Roles } from '../auth/roles.guard/roles.decorator';
import { UserRoles } from '../user/enums/user.enum';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('api/v1/winning-numbers')
export class WinningNumbersController {
  constructor(private readonly winningNumbersService: WinningNumbersService) {}

  @Post()
  @UseGuards(AuthGuard, BacklistGuard)
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
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  remove(@Param('id') id: string) {
    return this.winningNumbersService.remove(+id);
  }
}
