import { Injectable } from '@nestjs/common';
import { CreateManageBonusPriceDto } from './dto/create-manage-bonus-price.dto';
import { UpdateManageBonusPriceDto } from './dto/update-manage-bonus-price.dto';
import { ManageBonusPrice } from './entities/manage-bonus-price.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MAINTENANCE_PERIOD, START_TIME_CREATE_JOB, TypeLottery } from 'src/system/constants';
import { addHours, startOfDay } from 'date-fns';

@Injectable()
export class ManageBonusPriceService {
  constructor(
    @InjectRepository(ManageBonusPrice)
    private manageBonusPriceRepository: Repository<ManageBonusPrice>,
  ) { }

  create(createManageBonusPriceDto: CreateManageBonusPriceDto) {
    return this.manageBonusPriceRepository.save(createManageBonusPriceDto);
  }

  findAll() {
    return `This action returns all manageBonusPrice`;
  }

  findOne(id: number) {
    return `This action returns a #${id} manageBonusPrice`;
  }

  findBonusPriceByType({
    type,
    fromDate,
    toDate,
    isTestPlayer,
  }: any) {
    return this.manageBonusPriceRepository.findOne({
      where: {
        type,
        toDate,
        fromDate,
        isTestPlayer,
      },
    });
  }

  update(id: number, updateManageBonusPriceDto: UpdateManageBonusPriceDto) {
    return this.manageBonusPriceRepository.update(id, updateManageBonusPriceDto);
  }

  remove(id: number) {
    return `This action removes a #${id} manageBonusPrice`;
  }

  async initBonusPrice(date: Date) {
    const gameTypes = [
      TypeLottery.XSMB_1S,
      TypeLottery.XSMT_1S,
      TypeLottery.XSMN_1S,
      TypeLottery.XSSPL_1S,
      TypeLottery.XSMB_45S,
      TypeLottery.XSMT_45S,
      TypeLottery.XSMN_45S,
      TypeLottery.XSSPL_45S,
      TypeLottery.XSSPL_60S,
      TypeLottery.XSSPL_90S,
      TypeLottery.XSSPL_120S,
      TypeLottery.XSMB_180S,
      TypeLottery.XSMT_180S,
      TypeLottery.XSMN_180S,
      TypeLottery.XSSPL_360S,
    ];
    const timeStartDay = startOfDay(date);
    let fromDate = addHours(timeStartDay, START_TIME_CREATE_JOB).getTime();
    const toDate = fromDate + ((24 * 60 * 60) - (MAINTENANCE_PERIOD * 60)) * 1000;
    const promise = [];

    for (const gameType of gameTypes) {
      const bonusPriceOfUserReal = await this.findBonusPriceByType({
        toDate,
        fromDate,
        type: gameType,
        isTestPlayer: false,
      });

      if (bonusPriceOfUserReal) continue;

      promise.push(
        this.manageBonusPriceRepository.save({
          fromDate: fromDate.toString(),
          toDate: toDate.toString(),
          totalBet: 0,
          totalProfit: 0,
          bonusPrice: 0,
          type: gameType,
          isTestPlayer: false,
        }),
      );

      const bonusPriceOfUserFake = await this.findBonusPriceByType({
        toDate,
        fromDate,
        type: gameType,
        isTestPlayer: true,
      });
      
      if (bonusPriceOfUserFake) continue;

      promise.push(
        this.manageBonusPriceRepository.save({
          fromDate: fromDate.toString(),
          toDate: toDate.toString(),
          totalBet: 0,
          totalProfit: 0,
          bonusPrice: 0,
          type: gameType,
          isTestPlayer: true,
        }),
      );
    }

    await Promise.all(promise);
  }
}
