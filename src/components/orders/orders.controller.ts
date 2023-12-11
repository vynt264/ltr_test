import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';
import { ListOrderRequestDto } from '../order.request/dto/create.list.dto';
import { PaginationQueryDto } from 'src/common/common.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import { ValidationPipe } from './validations/validation.pipe';
import { Cron, Interval, SchedulerRegistry } from '@nestjs/schedule';
import { SocketGatewayService } from '../gateway/gateway.service';
import { CronJob } from 'cron';

@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly socketGateway: SocketGatewayService,
    private readonly schedulerRegistry: SchedulerRegistry,
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

  @Get('get-turn-index')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  getCurrentTurnIndex(@Query() query: { seconds: string }) {
    return this.ordersService.getCurrentTurnIndex(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  update(@Param('id') id: string, @Body() updateOrderDto: any) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
