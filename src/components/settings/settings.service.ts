import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
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
    const result = await this.settingRepository.find({
      where: {
        isDeleted: false,
      }
    });

    return Number(result?.[0]?.profit) || undefined;
  }
}
