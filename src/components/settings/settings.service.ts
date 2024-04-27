import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { PROFIT_PERCENTAGE_KEY } from 'src/system/config.system/config.default';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private redisCacheService: RedisCacheService,
  ) { }

  create(createSettingDto: CreateSettingDto) {
    return this.settingRepository.save(createSettingDto);
  }

  async findAll() {
    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    return result?.[0] || {};
  }

  findOne(id: number) {
    return this.settingRepository.findOne({
      where: {
        id,
      }
    });
  }

  update(id: number, updateSettingDto: UpdateSettingDto) {
    return this.settingRepository.update(id, updateSettingDto);
  }

  remove(id: number) {
    return this.settingRepository.update(id, { isDeleted: true });
  }

  async getProfit() {
    const profit = await this.redisCacheService.get(`${PROFIT_PERCENTAGE_KEY}`);

    if (
      profit ||
      profit === 0
    ) {
      return Number(profit);
    }

    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    if (result?.[0]?.profit || result?.[0]?.profit === 0) {
      await this.redisCacheService.set(`${PROFIT_PERCENTAGE_KEY}`, Number(result?.[0]?.profit));
    }

    return Number(result?.[0]?.profit) || undefined;
  }

  async isUseBonus() {
    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    return (
      (
        result[0]?.isUseBonus === false
        || result[0]?.isUseBonus === true
      ) ? result[0]?.isUseBonus : true
    );
  }

  async isMaxPayout() {
    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    return (
      (
        result[0]?.isMaxPayout === false
        || result[0]?.isMaxPayout === true
      ) ? result[0]?.isMaxPayout : true
    );
  }
}
