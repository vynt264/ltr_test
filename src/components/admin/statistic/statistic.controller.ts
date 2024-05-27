import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  BadRequestException,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { Logger } from 'winston';
import { AuthAdminGuard } from 'src/components/auth/guards/auth-admin.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from 'src/components/auth/roles.guard/roles.decorator';
import { RIGHTS } from 'src/system/constants/rights';

@Controller('api/v1/statistic')
@UseGuards(AuthAdminGuard, RolesGuard)
export class StatisticController {
  constructor(
    private readonly statisticService: StatisticService,
    @Inject("winston")
    private readonly logger: Logger,
  ) { }

  @Get()
  @Roles(RIGHTS.ShowReportOrdersByBookmarker)
  async reportByBookmarker(@Query() query: any, @Request() req: any) {
    try {
      return await this.statisticService.reportByBookmarker(query, req.user);
    } catch (err) {
      this.logger.error(`${StatisticController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get('orders')
  @Roles(RIGHTS.ShowReportOrders)
  async reportOrdersByUser(@Query() query: any, @Request() req: any) {
    try {
      return await this.statisticService.reportOrdersByUser(query, req.user);
    } catch (err) {
      this.logger.error(`${StatisticController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get('by-game')
  @Roles(RIGHTS.ShowReportOrdersByGame)
  reportByGame(@Query() query: any, @Request() req: any) {
    try {
      return this.statisticService.reportByGame(query, req.user);
    } catch (err) {
      this.logger.error(`${StatisticController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get('by-user')
  @Roles(RIGHTS.ShowReportOrdersByUser)
  reportByUser(@Query() query: any, @Request() req: any) {
    try {
      return this.statisticService.reportByUser(query, req.user);
    } catch (err) {
      this.logger.error(`${StatisticController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Post()
  create(@Body() createStatisticDto: CreateStatisticDto) {
    try {
      return this.statisticService.create(createStatisticDto);
    } catch (err) {
      this.logger.error(`${StatisticController.name} is Logging error: ${JSON.stringify(err)}`);
      throw new BadRequestException(err);
    }
  }

  @Get()
  findAll() {
    return this.statisticService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.statisticService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStatisticDto: UpdateStatisticDto) {
    return this.statisticService.update(+id, updateStatisticDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.statisticService.remove(+id);
  }
}
