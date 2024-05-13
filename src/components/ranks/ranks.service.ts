import { Injectable } from '@nestjs/common';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rank } from './entities/rank.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RanksService {
  constructor(
    @InjectRepository(Rank)
    private rankRepository: Repository<Rank>,
  ) { }

  create(createRankDto: CreateRankDto) {
    return 'This action adds a new rank';
  }

  findAll() {
    return `This action returns all ranks`;
  }

  findOne(id: number) {
    return this.rankRepository.findOneBy({ id });
  }

  async getRankDefault() {
    const ranks = await this.rankRepository.find({
      where: {
        isDeleted: false,
      },
      order: { id: 'ASC' },
    });

    return ranks?.[0];
  }

  update(id: number, updateRankDto: UpdateRankDto) {
    return `This action updates a #${id} rank`;
  }

  remove(id: number) {
    return `This action removes a #${id} rank`;
  }
}
