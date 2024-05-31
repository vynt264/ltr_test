import { Inject, Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { IS_BONUS_KEY, IS_MAX_PAYOUT, PROFIT_PERCENTAGE_KEY } from 'src/system/config.system/config.default';
import { Logger } from 'winston';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private redisCacheService: RedisCacheService,

    @Inject("winston")
    private readonly logger: Logger,
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
    const profit = await this.redisCacheService.get(PROFIT_PERCENTAGE_KEY);

    if (
      profit ||
      profit === 0
    ) {
      return profit;
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
    let bonus = await this.redisCacheService.get(`${IS_BONUS_KEY}`);

    if (bonus === false || bonus === true) {
      return bonus;
    }

    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    bonus = (
      (
        result[0]?.isUseBonus === false
        || result[0]?.isUseBonus === true
      ) ? result[0]?.isUseBonus : false
    );

    await this.redisCacheService.set(`${IS_BONUS_KEY}`, bonus);

    return bonus;
  }

  async isMaxPayout() {
    let isMaxPayout = await this.redisCacheService.get(IS_MAX_PAYOUT);
    if (isMaxPayout === false || isMaxPayout === true) {
      return isMaxPayout;
    }

    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    isMaxPayout = (
      (
        result[0]?.isMaxPayout === false
        || result[0]?.isMaxPayout === true
      ) ? result[0]?.isMaxPayout : false
    );

    await this.redisCacheService.set(`${IS_MAX_PAYOUT}`, isMaxPayout);

    return isMaxPayout;
  }

  async getTimeResetBonus() {
    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      },
    });

    return result[0]?.timeResetBonus || 0;
  }

  async getLimitPayout() {
    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      },
    });

    return Number(result[0]?.limitPayOut) || 0;
  }
}
