import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateBonusSettingDto } from './dto/create-bonus-setting.dto';
import { UpdateBonusSettingDto } from './dto/update-bonus-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BonusSetting } from './entities/bonus-setting.entity';
import { Repository } from 'typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { BONUS_CONFIG } from 'src/system/config.system/config.default';

@Injectable()
export class BonusSettingService {
  constructor(
    @InjectRepository(BonusSetting)
    private bonusSettingRepository: Repository<BonusSetting>,

    @Inject(forwardRef(() => RedisCacheService))
    private redisCacheService: RedisCacheService,
  ) { }

  create(createBonusSettingDto: CreateBonusSettingDto) {
    return 'This action adds a new bonusSetting';
  }

  async findAll() {
    let bonus = await this.redisCacheService.get(`${BONUS_CONFIG}`);

    if (bonus !== null) {
      bonus = JSON.parse(bonus.toString());

      return bonus;
    }

    bonus = await this.bonusSettingRepository.find({
      where: {
        isDeleted: false,
      },
    });

    await this.redisCacheService.set(`${BONUS_CONFIG}`, JSON.stringify(bonus));

    return bonus;
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
