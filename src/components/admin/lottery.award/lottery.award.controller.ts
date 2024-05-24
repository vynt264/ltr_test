import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { LotteryAwardService } from './lottery.award.service';
import { CreateLotteryAwardDto } from './dto/create-lottery.award.dto';
import { UpdateLotteryAwardDto } from './dto/update-lottery.award.dto';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { PaginationQueryDto } from 'src/common/common.dto';

@Controller('/api/v1/admin-lottery-awards')
@UseGuards(AuthAdminGuard)
export class LotteryAwardController {
  constructor(private readonly lotteryAwardService: LotteryAwardService) {}

  @Post()
  create(@Body() createLotteryAwardDto: CreateLotteryAwardDto) {
    return this.lotteryAwardService.create(createLotteryAwardDto);
  }

  @Get()
  findAll(@Query() paginationQueryDto: PaginationQueryDto, @Request() req: any) {
    return this.lotteryAwardService.findAll(paginationQueryDto, req.user);
  }

  @Get('report')
  report(@Query() query: any) {
    return this.lotteryAwardService.report(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lotteryAwardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLotteryAwardDto: UpdateLotteryAwardDto) {
    return this.lotteryAwardService.update(+id, updateLotteryAwardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lotteryAwardService.remove(+id);
  }
}
