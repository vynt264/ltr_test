import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RanksService } from './ranks.service';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';

@Controller('api/v1/admin-ranks')
@UseGuards(AuthAdminGuard)
export class RanksController {
  constructor(private readonly ranksService: RanksService) {}

  @Post()
  create(@Body() createRankDto: CreateRankDto) {
    return this.ranksService.create(createRankDto);
  }

  @Get()
  findAll() {
    return this.ranksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ranksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRankDto: UpdateRankDto) {
    return this.ranksService.update(+id, updateRankDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ranksService.remove(+id);
  }
}
