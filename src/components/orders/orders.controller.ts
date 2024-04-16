import { Controller, Get, Post, Body, HttpStatus, Res, Param, Delete, UseGuards, Request, Query, Put, Inject, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

import { OrdersService } from './orders.service';
import { BacklistGuard } from '../backlist/backlist.guard';
import { PaginationQueryDto } from 'src/common/common.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import { ValidationPipe } from './validations/validation.pipe';
import { ERROR } from "../../system/constants";
import { Logger } from 'winston';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  @Post()
  @UseGuards(AuthGuard, BacklistGuard)
  async create(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    try {
      return await this.ordersService.create(orders, req.user);
    } catch (err) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get()
  @UseGuards(AuthGuard, BacklistGuard)
  async findAll(@Query() paginationDto: PaginationQueryDto, @Request() req: any): Promise<any> {
    try {
      return await this.ordersService.findAll(paginationDto, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Post('1s/validation')
  @UseGuards(AuthGuard, BacklistGuard)
  async validationOrdersImmediate(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    try {
      return await this.ordersService.validationOrdersImmediate(orders, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Post('1s')
  @UseGuards(AuthGuard, BacklistGuard)
  async betOrdersImmediate(@Body(new ValidationPipe()) orders: CreateListOrdersDto, @Request() req: any) {
    try {
      return await this.ordersService.betOrdersImmediate(orders, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get('combine-orders-by-date')
  @UseGuards(AuthGuard, BacklistGuard)
  async combineOrdersByDate(@Query() paginationDto: PaginationQueryDto, @Request() req: any): Promise<any> {
    try {
      return await this.ordersService.combineOrdersByDate(paginationDto, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get('get-turn-index')
  async getCurrentTurnIndex(@Query() query: { seconds: string, type: string, isTestPlayerClient: boolean }, @Request() req: any) {
    try {
      return this.ordersService.getCurrentTurnIndex(query, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Post('generate-follow-up-plan')
  @UseGuards(AuthGuard, BacklistGuard)
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
      throw new BadRequestException(error);
    }
  }

  @Post('confirm-generate-follow-up-plan')
  @UseGuards(AuthGuard, BacklistGuard)
  async confirmGenerateFollowUpPlan(
    @Body() data: any,
    @Request() req: any,
  ) {
    try {
      return await this.ordersService.confirmGenerateFollowUpPlan(data, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  async findOne(@Param('id') id: string) {
    try {
      return await this.ordersService.findOne(+id);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Put(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  async update(@Param('id') id: string, @Body() updateOrderDto: any, @Request() req: any) {
    try {
      return await this.ordersService.update(+id, updateOrderDto, req.user);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, BacklistGuard)
  async remove(@Param('id') id: string) {
    try {
      return await this.ordersService.remove(+id);
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
    }
  }

  @Post('handle-balace')
  @UseGuards(AuthGuard, BacklistGuard)
  async handleBalance(@Body() data: any, @Request() req: any) {
    const {
      turnIndex,
      prizes,
      gameType,
    } = data;

    try {
      return this.ordersService.handleBalance({
        turnIndex,
        prizes,
        gameType,
        user: req.user,
      });
    } catch (error) {
      this.logger.error(`${OrdersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
