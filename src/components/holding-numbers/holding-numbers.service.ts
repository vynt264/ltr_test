import { Injectable } from '@nestjs/common';
import { CreateHoldingNumberDto } from './dto/create-holding-number.dto';
import { UpdateHoldingNumberDto } from './dto/update-holding-number.dto';
import { HoldingNumber } from './entities/holding-number.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class HoldingNumbersService {
  constructor(
    @InjectRepository(HoldingNumber)
    private readonly holdingNumberRepository: Repository<HoldingNumber>,
  ) { }

  create(createHoldingNumberDto: CreateHoldingNumberDto) {
    return this.holdingNumberRepository.save(createHoldingNumberDto);
  }

  findAll() {
    return `This action returns all holdingNumbers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} holdingNumber`;
  }

  update(id: number, updateHoldingNumberDto: UpdateHoldingNumberDto) {
    return `This action updates a #${id} holdingNumber`;
  }

  remove(id: number) {
    return `This action removes a #${id} holdingNumber`;
  }
}
