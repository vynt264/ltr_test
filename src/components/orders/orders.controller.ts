import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
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

@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  create(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    return this.ordersService.create(orders, req.user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findAll(@Query() paginationDto: PaginationQueryDto): Promise<any> {
    return this.ordersService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
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
