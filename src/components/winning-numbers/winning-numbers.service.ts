import { Injectable } from '@nestjs/common';
import { CreateWinningNumberDto } from './dto/create-winning-number.dto';
import { UpdateWinningNumberDto } from './dto/update-winning-number.dto';
import { Repository } from 'typeorm';
import { WinningNumber } from './entities/winning-number.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WinningNumbersService {
  constructor(
    @InjectRepository(WinningNumber)
    private winningNumberRepository: Repository<WinningNumber>,
  ) { }

  create(createWinningNumberDto: CreateWinningNumberDto) {
    return this.winningNumberRepository.save(createWinningNumberDto);
  }

  findAll() {
    return `This action returns all winningNumbers`;
  }

  findOne(id: number) {
    return `This action returns a #${id} winningNumber`;
  }

  update(id: number, updateWinningNumberDto: UpdateWinningNumberDto) {
    return `This action updates a #${id} winningNumber`;
  }

  remove(id: number) {
    return `This action removes a #${id} winningNumber`;
  }
}
