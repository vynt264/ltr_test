import { Controller, Get, Post, Body, HttpStatus, Res, Param, Delete, UseGuards, Request, Query, Put, Inject } from '@nestjs/common';
import { Response } from 'express';

import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { BacklistGuard } from '../backlist/backlist.guard';
import { RateLimitGuard } from '../auth/rate.guard/rate.limit.guard';
import { PaginationQueryDto } from 'src/common/common.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import { ValidationPipe } from './validations/validation.pipe';
import { ERROR } from "../../system/constants";
import { RedisCacheService } from 'src/system/redis/redis.service';
import { Logger } from 'winston';

@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async create(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    try {
      return await this.ordersService.create(orders, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async findAll(@Query() paginationDto: PaginationQueryDto, @Request() req: any): Promise<any> {
    try {
      return await this.ordersService.findAll(paginationDto, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Post('1s/validation')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async validationOrdersImmediate(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    try {
      return await this.ordersService.validationOrdersImmediate(orders, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Post('1s')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async betOrdersImmediate(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    try {
      return await this.ordersService.betOrdersImmediate(orders, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Get('combine-orders-by-date')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async combineOrdersByDate(@Query() paginationDto: PaginationQueryDto, @Request() req: any): Promise<any> {
    try {
      return await this.ordersService.combineOrdersByDate(paginationDto, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Get('get-turn-index')
  async getCurrentTurnIndex(@Query() query: { seconds: string, type: string, isTestPlayerClient: boolean }, @Request() req: any) {
    try {
      return this.ordersService.getCurrentTurnIndex(query, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Post('generate-follow-up-plan')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async generateFollowUpPlan(
    @Res() response: Response,
    @Request() req: any,
    @Body() data: any,
  ) {
    try {
      const result = await this.ordersService.generateFollowUpPlan(
        {
          boiSo: data.boiSo,
          cachLuot: data.cachLuot,
          nhieuX: data.nhieuX,
          soLuot: data.soLuot,
          order: data.order,
        },
        req.user,
      );

      if (result.isValidAmount) {
        return response.status(HttpStatus.CREATED).json({
          data: result,
          success: false,
          statusCode: HttpStatus.CREATED,
          message: ERROR.ACCOUNT_BALANCE_IS_INSUFFICIENT,
        });
      }

      return response.status(HttpStatus.CREATED).json({
        data: result,
        success: true,
        statusCode: HttpStatus.CREATED,
        message: "success",
      });

    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Post('confirm-generate-follow-up-plan')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async confirmGenerateFollowUpPlan(
    @Body() data: any,
    @Request() req: any,
  ) {
    try {
      return await this.ordersService.confirmGenerateFollowUpPlan(data, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async findOne(@Param('id') id: string) {
    try {
      return await this.ordersService.findOne(+id);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async update(@Param('id') id: string, @Body() updateOrderDto: any, @Request() req: any) {
    try {
      return await this.ordersService.update(+id, updateOrderDto, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async remove(@Param('id') id: string) {
    try {
      return await this.ordersService.remove(+id);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }
}
