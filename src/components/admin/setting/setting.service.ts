import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { Repository } from 'typeorm';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { IS_MAX_PAYOUT, IS_BONUS_KEY, PROFIT_PERCENTAGE_KEY } from 'src/system/config.system/config.default';
import { ScheduleService } from 'src/components/schedule/schedule.service';
import { addDays } from 'date-fns';
import { Logger } from 'winston';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private readonly redisCacheService: RedisCacheService,

    @Inject(forwardRef(() => ScheduleService))
    private scheduleService: ScheduleService,

    @Inject("winston")
    private readonly logger: Logger,
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
    this.logger.info(`Update setting - ${new Date()}`);

    if (
      updateSettingDto.profit ||
      Number(updateSettingDto.profit) === 0
    ) {
      await this.redisCacheService.set(`${PROFIT_PERCENTAGE_KEY}`, Number(updateSettingDto.profit));
    }

    if (updateSettingDto.isUseBonus === true || updateSettingDto.isUseBonus === false) {
      await this.redisCacheService.set(`${IS_BONUS_KEY}`, Boolean(updateSettingDto.isUseBonus));
    }

    if (updateSettingDto.isMaxPayout === true || updateSettingDto.isMaxPayout === false) {
      await this.redisCacheService.set(`${IS_MAX_PAYOUT}`, Boolean(updateSettingDto.isMaxPayout));
    }

    const setting = await this.settingRepository.update(id, updateSettingDto);
    if (Number(updateSettingDto.timeResetBonus) > 0) {
      const currentDate = new Date();
      const nextDate = addDays(currentDate, 1);

      await this.scheduleService.deleteJobResetBonus(currentDate);
      await this.scheduleService.deleteJobResetBonus(nextDate);
      await this.scheduleService.generateJobResetBonus(currentDate);
      await this.scheduleService.generateJobResetBonus(nextDate);
    }

    return setting;
  }

  remove(id: number) {
    return this.settingRepository.update(id, { isDeleted: true });
  }
}
