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
    return this.bonusSettingRepository.save(createBonusSettingDto);
  }

  findAll() {
    return this.bonusSettingRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  findOne(id: number) {
    return this.bonusSettingRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updateBonusSettingDto: UpdateBonusSettingDto) {
    return this.bonusSettingRepository.update(id, updateBonusSettingDto);
  }

  remove(id: number) {
    return this.bonusSettingRepository.update(id, { isDeleted: true });
  }
}
