import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { Repository } from 'typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { PROFIT_PERCENTAGE_KEY } from 'src/system/config.system/config.default';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private readonly redisCacheService: RedisCacheService
  ) { }

  async create(createSettingDto: CreateSettingDto) {
    if (
      createSettingDto.profit ||
      Number(createSettingDto.profit) === 0
    ) {
      await this.redisCacheService.set(`${PROFIT_PERCENTAGE_KEY}`, Number(createSettingDto.profit));
    }

    return await this.settingRepository.save(createSettingDto);
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

  async update(id: number, updateSettingDto: UpdateSettingDto) {
    if (
      updateSettingDto.profit ||
      Number(updateSettingDto.profit) === 0
    ) {
      await this.redisCacheService.set(`${PROFIT_PERCENTAGE_KEY}`, Number(updateSettingDto.profit));
    }
    return this.settingRepository.update(id, updateSettingDto);
  }

  remove(id: number) {
    return this.settingRepository.update(id, { isDeleted: true });
  }
}
