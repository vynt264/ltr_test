import { Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, addHours } from "date-fns";

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/user.entity';
import { ListOrderRequestDto } from '../order.request/dto/create.list.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRequest } from '../order.request/order.request.entity';
import { Between, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { PaginationQueryDto } from 'src/common/common.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import { BaCangType, BaoLoType, BetTypeName, BonCangType, CategoryLotteryType, CategoryLotteryTypeName, DanhDeType, DauDuoiType, LoTruocType, LoXienType } from 'src/system/enums/lotteries';
import { TypeLottery } from 'src/system/constants';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRequestRepository: Repository<Order>,
    private readonly redisService: RedisCacheService,
  ) { }

  async create(data: CreateListOrdersDto, member: User) {
    const fromDate = startOfDay(new Date()).getTime();
    const toDate = (new Date()).getTime();
    let result: any;
    let promises = [];
    const turnIndex = this.getTurnIndex();

    const bookmakerId = '1';
    this.saveRedis(data.orders, bookmakerId);

    for (const order of data.orders) {
      order.turnIndex = turnIndex;
      order.numericalOrder = this.getRandomTradingCode();
      order.betTypeName = this.getCategoryLotteryTypeName(order.betType);
      order.childBetTypeName = this.getBetTypeName(order.childBetType);
      order.seconds = this.getPlayingTimeByType(order.type);
      order.type = this.getTypeLottery(order.type);
      order.numberOfBets = this.getNumberOfBets(order.childBetType, order.detail);

      promises.push(this.orderRequestRepository.save(order));

      if (promises.length === 1000) {
        const tempResult = await Promise.all(promises);
        result = result.concat(tempResult);
        promises = [];
      }
    }

    if (promises.length === 0) return;

    result = await Promise.all(promises);

    return result;
  }

  async findAll(paginationDto: PaginationQueryDto) {
    let { take: perPage, skip: page, order, type, seconds } = paginationDto;

    if (!perPage || perPage <= 0) {
      perPage = 10;
    }

    page = Number(page) || 1;
    seconds = Number(seconds) || 0;

    if (!page || page <= 0) {
      page = 1;
    }
    const skip = +perPage * +page - +perPage;

    const fromDate = startOfDay(new Date(paginationDto.date));
    const toDate = endOfDay(new Date(paginationDto.date));
    const condition: any = {};

    if (paginationDto.status) {
      condition.status = paginationDto.status;
    }
    if (paginationDto.date) {
      condition.createdAt = Between(fromDate, toDate);
    }
    if (paginationDto.seconds) {
      condition.seconds = paginationDto.seconds;
    }
    if (paginationDto.type) {
      condition.type = paginationDto.type;
    }

    const [orders, total] = await this.orderRequestRepository.findAndCount({
      where: condition,
      order: { id: order },
      take: perPage,
      skip: skip,
    });

    const lastPage = Math.ceil(total / perPage);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      data: orders,
      currentPage: page,
    }
  }

  async findOne(id: number) {
    return this.orderRequestRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updateOrderDto: any) {
    return this.orderRequestRepository.update(id, updateOrderDto);
  }

  remove(id: number) {
    return this.orderRequestRepository.delete(id);
  }

  getCurrentTurnIndex(query: { seconds: string }) {
    if (!query.seconds) {
      return {};
    }
    const startOf7AM = startOfDay(new Date());
    const fromDate = addHours(startOf7AM, 7).getTime();

    const toDate = (new Date()).getTime();
    const times = Math.floor(((toDate - fromDate) / 1000) / parseInt(query.seconds));
    const secondsInCurrentRound = (toDate / 1000) % parseInt(query.seconds);

    return {
      currentTurnIndex: `${(new Date()).toLocaleDateString()} - ${times}`,
      currentSeconds: Math.round(secondsInCurrentRound),
    };
  }

  getCategoryLotteryTypeName(type: String) {

    let typeName = '';
    switch (type) {
      case CategoryLotteryType.BaoLo:
        typeName = CategoryLotteryTypeName.BaoLo;
        break;

      case CategoryLotteryType.LoXien:
        typeName = CategoryLotteryTypeName.LoXien;
        break;

      case CategoryLotteryType.DanhDe:
        typeName = CategoryLotteryTypeName.DanhDe;
        break;

      case CategoryLotteryType.DauDuoi:
        typeName = CategoryLotteryTypeName.DauDuoi;
        break;

      case CategoryLotteryType.Lo3Cang:
        typeName = CategoryLotteryTypeName.Lo3Cang;
        break;

      case CategoryLotteryType.Lo4Cang:
        typeName = CategoryLotteryTypeName.Lo4Cang;
        break;

      case CategoryLotteryType.LoTruot:
        typeName = CategoryLotteryTypeName.LoTruot;
        break;

      case CategoryLotteryType.TroChoiThuVi:
        typeName = CategoryLotteryTypeName.TroChoiThuVi;
        break;

      default:
        break;
    }

    return typeName;
  }

  getBetTypeName(type: String) {

    let typeName = '';
    switch (type) {
      case BaoLoType.Lo2So:
        typeName = BetTypeName.Lo2So;
        break;

      case BaoLoType.Lo2So1k:
        typeName = BetTypeName.Lo2So1k;
        break;

      case BaoLoType.Lo3So:
        typeName = BetTypeName.Lo3So;
        break;

      case BaoLoType.Lo4So:
        typeName = BetTypeName.Lo4So;
        break;

      case LoXienType.Xien2:
        typeName = BetTypeName.Xien2;
        break;

      case LoXienType.Xien3:
        typeName = BetTypeName.Xien3;
        break;

      case LoXienType.Xien4:
        typeName = BetTypeName.Xien4;
        break;

      case DanhDeType.DeDau:
        typeName = BetTypeName.DeDau;
        break;

      case DanhDeType.DeDacBiet:
        typeName = BetTypeName.DeDacBiet;
        break;

      case DanhDeType.DeDauDuoi:
        typeName = BetTypeName.DeDauDuoi;
        break;

      case DauDuoiType.Dau:
        typeName = BetTypeName.Dau;
        break;

      case DauDuoiType.Duoi:
        typeName = BetTypeName.Duoi;
        break;

      case BaCangType.BaCangDau:
        typeName = BetTypeName.BaCangDau;
        break;

      case BaCangType.BaCangDacBiet:
        typeName = BetTypeName.BaCangDacBiet;
        break;

      case BaCangType.BaCangDauDuoi:
        typeName = BetTypeName.BaCangDauDuoi;
        break;

      case BonCangType.BonCangDacBiet:
        typeName = BetTypeName.BonCangDacBiet;
        break;

      case LoTruocType.TruotXien4:
        typeName = BetTypeName.TruotXien4;
        break;

      case LoTruocType.TruotXien8:
        typeName = BetTypeName.TruotXien8;
        break;
      case LoTruocType.TruotXien10:
        typeName = BetTypeName.TruotXien10;
        break;

      default:
        break;
    }

    return typeName;
  }

  getPlayingTimeByType(type: String) {

    let seconds = 0;
    switch (type) {
      case TypeLottery.XSMB_1S:
      case TypeLottery.XSMN_1S:
      case TypeLottery.XSSPL_1S:
        seconds = 1;
        break;

      case TypeLottery.XSMB_45S:
      case TypeLottery.XSMN_45S:
      case TypeLottery.XSSPL_45S:
        seconds = 45;
        break;

      case TypeLottery.XSMB_180S:
      case TypeLottery.XSMT_180S:
        seconds = 180;
        break;

      default:
        break;
    }

    return seconds;
  }

  getTypeLottery(type: string) {
    let typeLottery;
    switch (type) {
      case TypeLottery.XSMB_1S:
      case TypeLottery.XSMB_45S:
      case TypeLottery.XSMB_180S:
        typeLottery = 'xsmb';
        break;

      case TypeLottery.XSMT_1S:
      case TypeLottery.XSMT_45S:
      case TypeLottery.XSMT_180S:
        typeLottery = 'xsmt';
        break;
    }

    return typeLottery;
  }

  getTurnIndex() {
    const fromDate = startOfDay(new Date()).getTime();
    const toDate = (new Date()).getTime();
    const times = Math.floor(((toDate - fromDate) / 1000) / 45);

    return `${(new Date()).toLocaleDateString()} - ${times}`;
  }

  getRandomTradingCode() {
    let result = 'B';
    for (let i = 0; i < 20; i++) {
      result += Math.floor(Math.random() * 10);
    }

    return result;
  }

  getNumberOfBets(childBetType: string, ordersDetail: string): number {
    if (!childBetType || !ordersDetail) return 0;

    let numberOfBets = 0;
    let dozens;
    let numbersDozens;
    let unitRow;
    let numbersUnitRow;
    let hundreds;

    switch (childBetType) {
      case BaoLoType.Lo2So:
        try {
          if ((ordersDetail.split('|').length - 1) === 1) {
            dozens = ordersDetail.split('|')[0];
            numbersDozens = dozens.split(',');
            unitRow = ordersDetail.split('|')[1];
            numbersUnitRow = unitRow.split(',');
            numberOfBets = numbersDozens.length * numbersUnitRow.length;
          } else {
            const numbers = ordersDetail.split(',');
            numberOfBets = numbers.length;
          }
        } catch (err) {
          numberOfBets = 0;
        }

        break;

      case BaoLoType.Lo3So:
        if ((ordersDetail.split('|').length - 1) === 2) {
          dozens = ordersDetail.split('|')[0];
          numbersDozens = dozens.split(',');
          unitRow = ordersDetail.split('|')[1];
          numbersUnitRow = unitRow.split(',');
          hundreds = ordersDetail.split('|')[2];
          numberOfBets = numbersDozens.length * numbersUnitRow.length * hundreds.length;
        } else {
          const numbers = ordersDetail.split(',');
          numberOfBets = numbers.length;
        }
        break;

      default:
        break;
    }

    return numberOfBets;
  }

  async saveRedis(orders: any, bookmakerId: string) {
    if (!orders || orders.length === 0) return;

    const key = `${orders[0]?.type}`;
    const initData = await this.initData(key);

    for (const order of orders) {
      this.handleOrders(order, initData);
    }

    // save data to redis
    await this.redisService.set(key, initData);
  }

  handleOrders(order: any, initData: any) {
    if (!order) return initData;

    let str1;
    let numbers1;
    let str2;
    let numbers2;
    let str3;
    let numbers3;
    let str4;
    let numbers4;
    let numbers: string[] = [];

    try {
      str1 = order.detail.split('|')[0];
      numbers1 = str1.split(',');
      str2 = order.detail.split('|')[1];
      numbers2 = str2.split(',');
      str3 = order.detail.split('|')[2];
      numbers3 = str3.split(',');
      str4 = order.detail.split('|')[3];
      numbers4 = str4.split(',');
    } catch (error) { }

    switch (order.childBetType) {
      case BaoLoType.Lo2So:
      case BaoLoType.Lo2So1k:
      case DanhDeType.DeDau:
      case DanhDeType.DeDacBiet:
      case DanhDeType.DeDauDuoi:
        numbers = [];
        if ((order.detail.split('|').length - 1) === 1) {
          for (const n1 of numbers1) {
            for (const n2 of numbers2) {
              const number = `${n1.toString()}${n2.toString()}`;
              numbers.push(number);
            }
          }
        } else {
          numbers = order.detail.split(',');
        }

        for (const number of numbers) {
          this.addOrder({
            typeBet: order.betType,
            childBetType: order.childBetType,
            multiple: order.multiple,
            number,
            initData,
          });
        }
        break;

      case BaoLoType.Lo3So:
      case BaCangType.BaCangDau:
      case BaCangType.BaCangDacBiet:
      case BaCangType.BaCangDauDuoi:
        numbers = [];
        if ((order.detail.split('|').length - 1) === 2) {
          for (const n1 of numbers1) {
            for (const n2 of numbers2) {
              for (const n3 of numbers3) {
                const number = `${n1.toString()}${n2.toString()}${n3.toString()}`;
                numbers.push(number);
              }
            }
          }
        } else {
          numbers = order.detail.split(',');
        }

        for (const number of numbers) {
          this.addOrder({
            typeBet: order.betType,
            childBetType: order.childBetType,
            multiple: order.multiple,
            number,
            initData,
          });
        }
        break;

      case BaoLoType.Lo4So:
      case BonCangType.BonCangDacBiet:
        numbers = [];
        if ((order.detail.split('|').length - 1) === 3) {
          for (const n1 of numbers1) {
            for (const n2 of numbers2) {
              for (const n3 of numbers3) {
                for (const n4 of numbers4) {
                  const number = `${n1.toString()}${n2.toString()}${n3.toString()}${n4.toString()}`;
                  numbers.push(number);
                }
              }
            }
          }
        } else {
          numbers = order.detail.split(',');
        }
        for (const number of numbers) {
          this.addOrder({
            typeBet: order.betType,
            childBetType: order.childBetType,
            multiple: order.multiple,
            number,
            initData,
          });
        }
        break;

      default:
        break;
    }

    return initData;
  }

  addOrder({ typeBet, childBetType, number, multiple, initData }: any) {
    let multipleTemp;
    if (initData[typeBet][childBetType][number]) {
      multipleTemp = initData[typeBet][childBetType][number] + multiple;
      initData[typeBet][childBetType][number] = multipleTemp;
    } else {
      multipleTemp = multiple;
    }

    initData[typeBet][childBetType][number] = multipleTemp;
  }

  async initData(key: string) {
    let data = await this.redisService.get(key);

    if (!data) {
      data = {
        [CategoryLotteryType.BaoLo]: {
          [BaoLoType.Lo2So]: {

          } as any,
          [BaoLoType.Lo2So1k]: {

          } as any,
          [BaoLoType.Lo3So]: {

          } as any,
          [BaoLoType.Lo4So]: {

          } as any,
        },
        [CategoryLotteryType.DanhDe]: {
          [DanhDeType.DeDacBiet]: {

          } as any,
          [DanhDeType.DeDauDuoi]: {

          } as any,
          [DanhDeType.DeDau]: {

          } as any,
        },
        [CategoryLotteryType.DauDuoi]: {
          [DauDuoiType.Dau]: {

          } as any,
          [DauDuoiType.Duoi]: {

          } as any,
        },
        [CategoryLotteryType.Lo4Cang]: {
          [BonCangType.BonCangDacBiet]: {

          } as any,
        },
        [CategoryLotteryType.Lo3Cang]: {
          [BaCangType.BaCangDacBiet]: {

          } as any,
          [BaCangType.BaCangDau]: {

          } as any,
          [BaCangType.BaCangDauDuoi]: {

          } as any,
        },
      };
    }

    return data;
  }

}
