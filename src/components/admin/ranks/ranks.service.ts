import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateRankDto } from './dto/create-rank.dto';
import { UpdateRankDto } from './dto/update-rank.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rank } from './entities/rank.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RanksService implements OnModuleInit {
  constructor(
    @InjectRepository(Rank)
    private rankRepository: Repository<Rank>,
  ) { }

  async onModuleInit() {
    const ranks = await this.findAll();
    if (ranks.length > 0) {
      return;
    }

    const ranksEnum = [
      { name: 'bronze', amount: 100000000 },
      { name: 'silver', amount: 1000000000 },
      { name: 'gold', amount: 1000000000 },
      { name: 'platium', amount: 1000000000 },
      { name: 'diamond', amount: 1000000000 },
      { name: 'immortal', amount: 0 },
    ];
    for (const rank of ranksEnum) {
      await this.create({
        rankName: rank.name,
        maxBetAmount: rank.amount,
      });
    }
  }

  create(createRankDto: CreateRankDto) {
    return this.rankRepository.save(createRankDto);
  }

  findAll() {
    return this.rankRepository.find({
      where: {
        isDeleted: false,
      },
      order: { id: 'ASC' },
    });
  }

  findOne(id: number) {
    return this.rankRepository.findOneBy({ id });
  }

  update(id: number, updateRankDto: UpdateRankDto) {
    return this.rankRepository.update(id, updateRankDto);
  }

  remove(id: number) {
    return this.rankRepository.update(id, { isDeleted: true });
  }
}
