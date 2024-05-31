import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateBonusSettingDto } from './dto/create-bonus-setting.dto';
import { UpdateBonusSettingDto } from './dto/update-bonus-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BonusSetting } from './entities/bonus-setting.entity';
import { Repository } from 'typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { BONUS_CONFIG, IS_BONUS_KEY } from 'src/system/config.system/config.default';

@Injectable()
export class BonusSettingService {
  constructor(
    @InjectRepository(BonusSetting)
    private bonusSettingRepository: Repository<BonusSetting>,

    @Inject(forwardRef(() => RedisCacheService))
    private redisCacheService: RedisCacheService,
  ) { }

  async create(createBonusSettingDto: CreateBonusSettingDto) {
    const bonusCreated = await this.bonusSettingRepository.save(createBonusSettingDto);

    await this.saveRedis();

    return bonusCreated;
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

  async update(id: number, updateBonusSettingDto: UpdateBonusSettingDto) {
    const bonusUpdated = await this.bonusSettingRepository.update(id, updateBonusSettingDto);

    await this.saveRedis();

    return bonusUpdated;
  }

  async remove(id: number) {
    const bonusDeleted = await this.bonusSettingRepository.update(id, { isDeleted: true });

    await this.saveRedis();

    return bonusDeleted;
  }

  async saveRedis() {
    const allBonus = await this.bonusSettingRepository.find({
      where: {
        isDeleted: false,
      },
    });

    await this.redisCacheService.set(`${BONUS_CONFIG}`, JSON.stringify(allBonus));
  }
}
