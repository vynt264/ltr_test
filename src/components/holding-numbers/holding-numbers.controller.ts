import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, BadRequestException } from '@nestjs/common';
import { HoldingNumbersService } from './holding-numbers.service';
import { CreateHoldingNumberDto } from './dto/create-holding-number.dto';
import { UpdateHoldingNumberDto } from './dto/update-holding-number.dto';
import { Logger } from 'winston';

@Controller('holding-numbers')
export class HoldingNumbersController {
  constructor(
    private readonly holdingNumbersService: HoldingNumbersService,
    @Inject("winston")
    private readonly logger: Logger,
  ) { }

  @Post()
  create(@Body() createHoldingNumberDto: CreateHoldingNumberDto) {
    try {
      return this.holdingNumbersService.create(createHoldingNumberDto);
    } catch (error) {
      this.logger.error(`${HoldingNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get()
  findAll() {
    try {
      return this.holdingNumbersService.findAll();
    } catch (error) {
      this.logger.error(`${HoldingNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.holdingNumbersService.findOne(+id);
    } catch (error) {
      this.logger.error(`${HoldingNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHoldingNumberDto: UpdateHoldingNumberDto) {
    try {
      return this.holdingNumbersService.update(+id, updateHoldingNumberDto);
    } catch (error) {
      this.logger.error(`${HoldingNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.holdingNumbersService.remove(+id);
    } catch (error) {
      this.logger.error(`${HoldingNumbersController.name} is Logging error: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
