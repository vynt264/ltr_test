import { Injectable } from '@nestjs/common';
import { CreateManageBonusPriceDto } from './dto/create-manage-bonus-price.dto';
import { UpdateManageBonusPriceDto } from './dto/update-manage-bonus-price.dto';
import { ManageBonusPrice } from './entities/manage-bonus-price.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MAINTENANCE_PERIOD, START_TIME_CREATE_JOB, TypeLottery } from 'src/system/constants';
import { addHours, startOfDay } from 'date-fns';
import { BookMakerService } from '../bookmaker/bookmaker.service';

@Injectable()
export class ManageBonusPriceService {
  constructor(
    @InjectRepository(ManageBonusPrice)
    private manageBonusPriceRepository: Repository<ManageBonusPrice>,
    private readonly bookMakerService: BookMakerService,
  ) { }

  create(createManageBonusPriceDto: CreateManageBonusPriceDto) {
    return this.manageBonusPriceRepository.save(createManageBonusPriceDto);
  }

  findAll() {
    return this.manageBonusPriceRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} manageBonusPrice`;
  }

  findBonusPriceByType({
    type,
    fromDate,
    toDate,
    isTestPlayer,
    // bookmakerId,
  }: any) {
    return this.manageBonusPriceRepository.findOne({
      where: {
        type,
        toDate,
        fromDate,
        isTestPlayer,
        // bookMaker: { id: bookmakerId },
      },
    });
  }

  update(id: number, updateManageBonusPriceDto: UpdateManageBonusPriceDto) {
    return this.manageBonusPriceRepository.update(id, updateManageBonusPriceDto);
  }

  async remove(id: number) {
    const listBonusPrice = await this.findAll();
    let delPromises = [];
    for (const bonus of listBonusPrice) {
      delPromises.push(
        this.manageBonusPriceRepository.delete(bonus.id)
      );

      if (delPromises.length === 2000) {
        await Promise.all(delPromises);
        delPromises = [];
      }
    }

    if (delPromises.length === 0) return;

    await Promise.all(delPromises);
  }

  async initBonusPrice(date: Date) {
    // const bookMarkers = await this.bookMakerService.getAllBookMaker();
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

    // for (const bookmarker of bookMarkers) {
    const promise = [];
    for (const gameType of gameTypes) {
      const bonusPriceOfUserReal = await this.findBonusPriceByType({
        toDate,
        fromDate,
        type: gameType,
        isTestPlayer: false,
        // bookmakerId: bookmarker.id,
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
          // bookMaker: { id: bookmarker.id },
        }),
      );

      const bonusPriceOfUserFake = await this.findBonusPriceByType({
        toDate,
        fromDate,
        type: gameType,
        isTestPlayer: true,
        // bookmakerId: bookmarker.id,
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
          // bookMaker: { id: bookmarker.id },
        }),
      );
      // }
    }
    await Promise.all(promise);
  }
}
