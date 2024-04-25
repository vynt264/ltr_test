import { Injectable } from '@nestjs/common';
import { CreateBonusSettingDto } from './dto/create-bonus-setting.dto';
import { UpdateBonusSettingDto } from './dto/update-bonus-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BonusSetting } from './entities/bonus-setting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BonusSettingService {
  constructor(
    @InjectRepository(BonusSetting)
    private bonusSettingRepository: Repository<BonusSetting>
  ) { }

  create(createBonusSettingDto: CreateBonusSettingDto) {
    return 'This action adds a new bonusSetting';
  }

  findAll() {
    return this.bonusSettingRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} bonusSetting`;
  }

  update(id: number, updateBonusSettingDto: UpdateBonusSettingDto) {
    return `This action updates a #${id} bonusSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} bonusSetting`;
  }
}
