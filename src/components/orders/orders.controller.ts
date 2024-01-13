import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';
import { PaginationQueryDto } from 'src/common/common.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import { ValidationPipe } from './validations/validation.pipe';

@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  create(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    return this.ordersService.create(orders, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findAll(@Query() paginationDto: PaginationQueryDto, @Request() req: any): Promise<any> {
    return this.ordersService.findAll(paginationDto, req.user);
  }

  @Get('combine-orders-by-date')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  combineOrdersByDate(@Query() paginationDto: PaginationQueryDto, @Request() req: any): Promise<any> {
    return this.ordersService.combineOrdersByDate(paginationDto, req.user);
  }

  @Get('get-turn-index')
  getCurrentTurnIndex(@Query() query: { seconds: string, type: string }, @Request() req: any) {
    return this.ordersService.getCurrentTurnIndex(query, req.user);
  }

  @Post('generate-follow-up-plan')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  generateFollowUpPlan(
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.ordersService.generateFollowUpPlan({
      boiSo: data.boiSo,
      cachLuot: data.cachLuot,
      nhieuX: data.nhieuX,
      soLuot: data.soLuot,
      order: data.order,
    });
  }

  @Post('confirm-generate-follow-up-plan')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  confirmGenerateFollowUpPlan(
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.ordersService.confirmGenerateFollowUpPlan(data, req.user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  update(@Param('id') id: string, @Body() updateOrderDto: any, @Request() req: any) {
    return this.ordersService.update(+id, updateOrderDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
