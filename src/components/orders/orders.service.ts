import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, addHours } from "date-fns";

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from '../user/user.entity';
import { ListOrderRequestDto } from '../order.request/dto/create.list.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRequest } from '../order.request/order.request.entity';
import { Between, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { PaginationQueryDto } from 'src/common/common.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateListOrdersDto } from './dto/create-list-orders.dto';
import {
  BaCangType,
  BaoLoType,
  BonCangType,
  CategoryLotteryType,
  DanhDeType,
  DauDuoiType,
  LoTruocType,
  LoXienType,
  TroChoiThuViType,
} from 'src/system/enums/lotteries';
import { ERROR } from 'src/system/constants';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';
import { LotteryAwardService } from '../lottery.award/lottery.award.service';
import { DateTimeHelper } from 'src/helpers/date-time';
import { OrderValidate } from './validations/order.validate';
import { OrderHelper } from 'src/common/helper';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRequestRepository: Repository<Order>,
    private readonly redisService: RedisCacheService,
    private readonly walletHandlerService: WalletHandlerService,
    private readonly lotteryAwardService: LotteryAwardService,
  ) { }

  async create(data: CreateListOrdersDto, member: any) {
    OrderValidate.validateOrders(data?.orders || []);
    // check balance
    const wallet = await this.walletHandlerService.findWalletByUserId(member.id);
    const totalBet = OrderHelper.getBalance(data.orders);
    if (totalBet > wallet.balance) {
      throw new HttpException(
        {
          message: ERROR.ACCOUNT_BALANCE_IS_INSUFFICIENT,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    let promises = [];
    const turnIndex = OrderHelper.getTurnIndex();
    const bookmakerId = member?.bookmakerId || 1;
    await this.prepareDataToGenerateAward(data.orders, bookmakerId);

    for (const order of data.orders) {
      order.turnIndex = turnIndex;
      order.numericalOrder = OrderHelper.getRandomTradingCode();
      const { betTypeName, childBetTypeName, numberOfBets } = OrderHelper.getInfoDetailOfOrder(order);
      order.seconds = OrderHelper.getPlayingTimeByType(order.type);
      order.type = OrderHelper.getTypeLottery(order.type);
      order.revenue = OrderHelper.getBetAmount(order.multiple, order.childBetType, numberOfBets);
      order.betTypeName = betTypeName;
      order.childBetTypeName = childBetTypeName;
      order.numberOfBets = numberOfBets;
      order.user = member;
      order.bookMaker = { id: member.bookmakerId } as any;

      promises.push(this.orderRequestRepository.save(order));
    }

    if (promises.length === 0) return;

    const result = await Promise.all(promises);

    await this.saveEachOrderOfUserToRedis(result, bookmakerId, member.id);

    // update balance
    const totalBetRemain = wallet.balance - totalBet;
    await this.walletHandlerService.update(wallet.id, { balance: totalBetRemain });

    return result;
  }

  async findAll(paginationDto: PaginationQueryDto, member: any) {
    // TODO: get orders by bookmakerId
    let {
      take: perPage,
      skip: page,
      order,
      type,
      seconds,
      date,
      status,
    } = paginationDto;

    if (!perPage || perPage <= 0) {
      perPage = 10;
    }

    page = Number(page) || 1;
    seconds = Number(seconds) || 0;

    if (!page || page <= 0) {
      page = 1;
    }

    const skip = +perPage * +page - +perPage;
    let fromD;
    let toD;

    if (date) {
      fromD = startOfDay(new Date(date));
      toD = endOfDay(new Date(date));
    }

    const conditionGetOrders: any = {
      user: { id: member.id },
    };
    const conditionCalcAllOrders: any = {
      userId: member.id,
    };

    let query = 'orders.userId = :userId ';
    if (status) {
      conditionGetOrders.status = status;
      conditionCalcAllOrders.status = status;
      query += `AND orders.status = :status `;
    }
    if (fromD && toD) {
      conditionGetOrders.createdAt = Between(fromD, toD);
      conditionCalcAllOrders.fromD = fromD.toISOString();
      conditionCalcAllOrders.toD = toD.toISOString();
      query += `AND orders.created_at between :fromD AND :toD `;
    }
    if (seconds) {
      conditionGetOrders.seconds = seconds;
      conditionCalcAllOrders.seconds = seconds;
      query += `AND orders.seconds = :seconds `;
    }
    if (type) {
      conditionGetOrders.type = type;
      conditionCalcAllOrders.type = type;
      query += `AND orders.type = :type `;
    }

    const [orders, total] = await this.orderRequestRepository.findAndCount({
      where: conditionGetOrders,
      order: { id: order },
      take: perPage,
      skip: skip,
    });

    const info = await this.orderRequestRepository
      .createQueryBuilder("orders")
      .select("count(*)", "totalBet")
      .addSelect("SUM(orders.revenue)", "totalRevenue")
      .addSelect("SUM(orders.paymentWin)", "totalPaymentWin")
      .where(query, conditionCalcAllOrders)
      .getRawOne();

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
      totalBet: info.totalBet || 0,
      totalRevenue: info.totalRevenue || 0,
      totalPaymentWin: info.totalPaymentWin || 0,
    }
  }

  async combineOrdersByDate(paginationDto: PaginationQueryDto, member: any) {
    let {
      order,
      toDate,
      fromDate,
      skip: page,
      take: perPage,
    } = paginationDto;

    if (!perPage || perPage <= 0) {
      perPage = 10;
    }
    page = Number(page) || 1;

    let fromD;
    let toD;
    if (fromDate) {
      fromD = startOfDay(new Date(fromDate));
    }
    if (toDate) {
      toD = endOfDay(new Date(toDate));
    }

    let orders;
    let total;
    let lastPage;
    let nextPage;
    let prevPage;
    const offset = (page - 1) * perPage;
    const allOrders = await this.orderRequestRepository.query(`
        SELECT CAST(created_at AS DATE) AS orderDate, SUM(entity.revenue) as totalBet
        FROM orders AS entity
        WHERE entity.userId = ${member.id}
        GROUP BY CAST(created_at AS DATE)
      `);
    total = allOrders.length;
    lastPage = Math.ceil(total / perPage);
    nextPage = page + 1 > lastPage ? null : page + 1;
    prevPage = page - 1 < 1 ? null : page - 1;

    let query = `
        SELECT CAST(created_at AS DATE) AS orderDate, SUM(entity.revenue) as totalBet, count(*) as orderCount, SUM(entity.paymentWin) as paymentWin
        FROM orders AS entity
        WHERE entity.userId = ${member.id}
      `;
    if (fromD && toD) {
      query += `AND entity.created_at >= '${fromD.toISOString()}' AND entity.created_at <= '${toD.toISOString()}'`;
    } else {
      if (fromD) {
        query += `AND entity.created_at >= '${fromD.toISOString()}'`;
      }
      if (toD) {
        query += `AND entity.created_at <= '${toD.toISOString()}'`;
      }
    }
    query += `
        GROUP BY CAST(created_at AS DATE)
        ORDER BY orderDate ${order || 'asc'}
        LIMIT ${perPage} OFFSET ${offset}
      `;

    orders = await this.orderRequestRepository.query(query);

    let totalOrderCount = 0;
    let totalPaymentWin = 0;
    for (const order of orders) {
      totalOrderCount += (Number(order.orderCount) || 0);
      totalPaymentWin += (Number(order.paymentWin) || 0);
    }

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      totalOrderCount,
      totalPaymentWin,
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

  async update(id: number, updateOrderDto: any, member: any) {
    let order = await this.orderRequestRepository.findOne({
      where: {
        id,
      },
    });

    if (member) {
      const keyOrdersOfBookmaker = OrderHelper.getKeyByBookmaker(member.bookmakerId.toString(), order);
      const dataByBookmakerId: any = await this.redisService.get(keyOrdersOfBookmaker);
      if (dataByBookmakerId) {
        const result: any = {};
        const orders: any = dataByBookmakerId[`user-id-${member.id}`];
        for (const key in orders) {
          if (key === OrderHelper.getKeyByOrder(order)) continue;
          result[key] = orders[key];
        }
        dataByBookmakerId[`user-id-${member.id}`] = result;
        await this.redisService.set(keyOrdersOfBookmaker, dataByBookmakerId);
      }

      let data: any = await this.redisService.get(keyOrdersOfBookmaker);
      if (data) {
        try {
          const orderDetail = this.transformOrderToObject(order);
          const availableOrders = data[order.betType][order.childBetType];
          const resultFinal: any = {};
          for (const key in availableOrders) {
            if (orderDetail[key]) {
              const remainScore = availableOrders[key] - orderDetail[key];
              if (remainScore > 0) {
                resultFinal[key] = remainScore;
              }
            } else {
              resultFinal[key] = availableOrders[key];
            }
          }

          data[order.betType][order.childBetType] = resultFinal;
          await this.redisService.set(keyOrdersOfBookmaker, data);
        } catch (err) { }
      }

      const wallet = await this.walletHandlerService.findWalletByUserId(member.id);
      const remainBalance = +wallet.balance + (+order.revenue);
      await this.walletHandlerService.updateWalletByUserId(+member.id, { balance: remainBalance });
    }

    if (order.status !== 'pending') return;

    return this.orderRequestRepository.update(id, updateOrderDto);
  }

  remove(id: number) {
    return this.orderRequestRepository.delete(id);
  }

  async getCurrentTurnIndex(query: { seconds: string, type: string }) {
    if (!query.seconds) {
      return {};
    }
    const startOf7AM = startOfDay(new Date());
    const fromDate = addHours(startOf7AM, 7).getTime();
    const toDate = (new Date()).getTime();
    const times = Math.floor(((toDate - fromDate) / 1000) / parseInt(query.seconds));
    const secondsInCurrentRound = (toDate / 1000) % parseInt(query.seconds);
    const openTime = toDate - (secondsInCurrentRound * 1000);
    const lotteryAward = await this.lotteryAwardService.getLotteryAwardByTurnIndex(`${DateTimeHelper.formatDate(new Date())}-${times}`, query.type);

    return {
      turnIndex: `${DateTimeHelper.formatDate(new Date())}-${times}`,
      nextTurnIndex: `${DateTimeHelper.formatDate(new Date())}-${times + 1}`,
      openTime: toDate - (secondsInCurrentRound * 1000),
      nextTime: openTime + (parseInt(query.seconds) * 1000),
      awardDetail: lotteryAward?.awardDetail || {},
    };
  }

  // getCategoryLotteryTypeName(type: String) {

  //   let typeName = '';
  //   switch (type) {
  //     case CategoryLotteryType.BaoLo:
  //       typeName = CategoryLotteryTypeName.BaoLo;
  //       break;

  //     case CategoryLotteryType.LoXien:
  //       typeName = CategoryLotteryTypeName.LoXien;
  //       break;

  //     case CategoryLotteryType.DanhDe:
  //       typeName = CategoryLotteryTypeName.DanhDe;
  //       break;

  //     case CategoryLotteryType.DauDuoi:
  //       typeName = CategoryLotteryTypeName.DauDuoi;
  //       break;

  //     case CategoryLotteryType.Lo3Cang:
  //       typeName = CategoryLotteryTypeName.Lo3Cang;
  //       break;

  //     case CategoryLotteryType.Lo4Cang:
  //       typeName = CategoryLotteryTypeName.Lo4Cang;
  //       break;

  //     case CategoryLotteryType.LoTruot:
  //       typeName = CategoryLotteryTypeName.LoTruot;
  //       break;

  //     case CategoryLotteryType.TroChoiThuVi:
  //       typeName = CategoryLotteryTypeName.TroChoiThuVi;
  //       break;

  //     default:
  //       break;
  //   }

  //   return typeName;
  // }

  // getBetTypeName(type: String) {

  //   let typeName = '';
  //   switch (type) {
  //     case BaoLoType.Lo2So:
  //       typeName = BetTypeName.Lo2So;
  //       break;

  //     case BaoLoType.Lo2So1k:
  //       typeName = BetTypeName.Lo2So1k;
  //       break;

  //     case BaoLoType.Lo3So:
  //       typeName = BetTypeName.Lo3So;
  //       break;

  //     case BaoLoType.Lo4So:
  //       typeName = BetTypeName.Lo4So;
  //       break;

  //     case LoXienType.Xien2:
  //       typeName = BetTypeName.Xien2;
  //       break;

  //     case LoXienType.Xien3:
  //       typeName = BetTypeName.Xien3;
  //       break;

  //     case LoXienType.Xien4:
  //       typeName = BetTypeName.Xien4;
  //       break;

  //     case DanhDeType.DeDau:
  //       typeName = BetTypeName.DeDau;
  //       break;

  //     case DanhDeType.DeDacBiet:
  //       typeName = BetTypeName.DeDacBiet;
  //       break;

  //     case DanhDeType.DeDauDuoi:
  //       typeName = BetTypeName.DeDauDuoi;
  //       break;

  //     case DauDuoiType.Dau:
  //       typeName = BetTypeName.Dau;
  //       break;

  //     case DauDuoiType.Duoi:
  //       typeName = BetTypeName.Duoi;
  //       break;

  //     case BaCangType.BaCangDau:
  //       typeName = BetTypeName.BaCangDau;
  //       break;

  //     case BaCangType.BaCangDacBiet:
  //       typeName = BetTypeName.BaCangDacBiet;
  //       break;

  //     case BaCangType.BaCangDauDuoi:
  //       typeName = BetTypeName.BaCangDauDuoi;
  //       break;

  //     case BonCangType.BonCangDacBiet:
  //       typeName = BetTypeName.BonCangDacBiet;
  //       break;

  //     case LoTruocType.TruotXien4:
  //       typeName = BetTypeName.TruotXien4;
  //       break;

  //     case LoTruocType.TruotXien8:
  //       typeName = BetTypeName.TruotXien8;
  //       break;

  //     case LoTruocType.TruotXien10:
  //       typeName = BetTypeName.TruotXien10;
  //       break;

  //     case TroChoiThuViType.Lo2SoGiaiDacBiet:
  //       typeName = BetTypeName.HaiSoDacBiet;
  //       break;

  //     default:
  //       break;
  //   }

  //   return typeName;
  // }

  // getPlayingTimeByType(type: String) {

  //   let seconds = 0;
  //   switch (type) {
  //     case TypeLottery.XSMB_1S:
  //     case TypeLottery.XSMT_1S:
  //     case TypeLottery.XSMN_1S:
  //     case TypeLottery.XSSPL_1S:
  //       seconds = 1;
  //       break;

  //     case TypeLottery.XSMB_45S:
  //     case TypeLottery.XSMN_45S:
  //     case TypeLottery.XSMT_45S:
  //     case TypeLottery.XSSPL_45S:
  //       seconds = 45;
  //       break;

  //     case TypeLottery.XSSPL_60S:
  //       seconds = 60;
  //       break;

  //     case TypeLottery.XSSPL_90S:
  //       seconds = 90;
  //       break;

  //     case TypeLottery.XSSPL_120S:
  //       seconds = 120;
  //       break;

  //     case TypeLottery.XSMB_180S:
  //     case TypeLottery.XSMT_180S:
  //     case TypeLottery.XSMN_180S:
  //       seconds = 180;
  //       break;

  //     case TypeLottery.XSSPL_360S:
  //       seconds = 360;
  //       break;

  //     default:
  //       break;
  //   }

  //   return seconds;
  // }

  // getTypeLottery(type: string) {
  //   let typeLottery;
  //   switch (type) {
  //     case TypeLottery.XSMB_1S:
  //     case TypeLottery.XSMB_45S:
  //     case TypeLottery.XSMB_180S:
  //       typeLottery = 'xsmb';
  //       break;

  //     case TypeLottery.XSMT_1S:
  //     case TypeLottery.XSMT_45S:
  //     case TypeLottery.XSMT_180S:
  //       typeLottery = 'xsmt';
  //       break;

  //     case TypeLottery.XSMN_1S:
  //     case TypeLottery.XSMN_45S:
  //     case TypeLottery.XSMN_180S:
  //       typeLottery = 'xsmn';
  //       break;

  //     case TypeLottery.XSSPL_1S:
  //     case TypeLottery.XSSPL_45S:
  //     case TypeLottery.XSSPL_60S:
  //     case TypeLottery.XSSPL_90S:
  //     case TypeLottery.XSSPL_120S:
  //     case TypeLottery.XSSPL_360S:
  //       typeLottery = 'xsspl';
  //       break;
  //   }

  //   return typeLottery;
  // }

  // getTurnIndex() {
  //   const time = `${(new Date()).toLocaleDateString()}, ${INIT_TIME_CREATE_JOB}`;
  //   const fromDate = new Date(time).getTime();
  //   const toDate = (new Date()).getTime();
  //   const times = Math.ceil(((toDate - fromDate) / 1000) / 45);

  //   return `${DateTimeHelper.formatDate(new Date())}-${times}`;
  // }

  // getRandomTradingCode() {
  //   let result = 'B';
  //   for (let i = 0; i < 20; i++) {
  //     result += Math.floor(Math.random() * 10);
  //   }

  //   return result;
  // }

  // getNumberOfBets(childBetType: string, ordersDetail: string): number {
  //   if (!childBetType || !ordersDetail) return 0;

  //   let numberOfBets = 0;
  //   let dozens;
  //   let numbersDozens;
  //   let unitRow;
  //   let numbersUnitRow;
  //   let hundreds;
  //   let numbersHundreds;
  //   let unit;
  //   let numbersUnits;

  //   switch (childBetType) {
  //     case BaoLoType.Lo2So:
  //     case BaoLoType.Lo2So1k:
  //     case DanhDeType.DeDau:
  //     case DanhDeType.DeDacBiet:
  //     case DanhDeType.DeDauDuoi:
  //       try {
  //         if ((ordersDetail.split('|').length - 1) === 1) {
  //           dozens = ordersDetail.split('|')[0];
  //           numbersDozens = dozens.split(',');
  //           unitRow = ordersDetail.split('|')[1];
  //           numbersUnitRow = unitRow.split(',');
  //           numberOfBets = numbersDozens.length * numbersUnitRow.length;
  //         } else {
  //           const numbers = ordersDetail.split(',');
  //           numberOfBets = numbers.length;
  //         }
  //       } catch (err) {
  //         numberOfBets = 0;
  //       }
  //       break;

  //     case BaoLoType.Lo3So:
  //     case BaCangType.BaCangDau:
  //     case BaCangType.BaCangDacBiet:
  //     case BaCangType.BaCangDauDuoi:
  //       if ((ordersDetail.split('|').length - 1) === 2) {
  //         dozens = ordersDetail.split('|')[0];
  //         numbersDozens = dozens.split(',');
  //         unitRow = ordersDetail.split('|')[1];
  //         numbersUnitRow = unitRow.split(',');
  //         hundreds = ordersDetail.split('|')[2];
  //         numbersHundreds = hundreds.split(',');
  //         numberOfBets = numbersDozens.length * numbersUnitRow.length * numbersHundreds.length;
  //       } else {
  //         const numbers = ordersDetail.split(',');
  //         numberOfBets = numbers.length;
  //       }
  //       break;

  //     case BaoLoType.Lo4So:
  //     case BonCangType.BonCangDacBiet:
  //       if ((ordersDetail.split('|').length - 1) === 3) {
  //         dozens = ordersDetail.split('|')[0];
  //         numbersDozens = dozens.split(',');
  //         unitRow = ordersDetail.split('|')[1];
  //         numbersUnitRow = unitRow.split(',');
  //         hundreds = ordersDetail.split('|')[2];
  //         numbersHundreds = hundreds.split(',');
  //         unit = ordersDetail.split('|')[3];
  //         numbersUnits = unit.split(',');
  //         numberOfBets = numbersDozens.length * numbersUnitRow.length * numbersHundreds.length * numbersUnits.length;
  //       } else {
  //         const numbers = ordersDetail.split(',');
  //         numberOfBets = numbers.length;
  //       }
  //       break;

  //     case LoXienType.Xien2:
  //     case LoXienType.Xien3:
  //     case LoXienType.Xien4:
  //       numberOfBets = 1;
  //       break;

  //     case LoTruocType.TruotXien4:
  //     case LoTruocType.TruotXien8:
  //     case LoTruocType.TruotXien10:
  //       numberOfBets = 1;
  //       break;

  //     case DauDuoiType.Dau:
  //     case DauDuoiType.Duoi:
  //       const numbers = ordersDetail.split(',');
  //       numberOfBets = numbers.length;
  //       break;

  //     case TroChoiThuViType.Lo2SoGiaiDacBiet:
  //       numberOfBets = 1;
  //       break;

  //     default:
  //       break;
  //   }

  //   return numberOfBets;
  // }

  async prepareDataToGenerateAward(orders: any, bookmakerId: string) {
    if (!orders || orders.length === 0) return;

    const key = `${bookmakerId}-${orders[0]?.type}`;
    const initData = await this.initData(key);

    for (const order of orders) {
      const { numbers } = OrderHelper.getInfoDetailOfOrder(order);
      for (const number of numbers) {
        OrderHelper.addOrder({
          typeBet: order.betType,
          childBetType: order.childBetType,
          multiple: order.multiple,
          number,
          initData,
        });
      }
      // this.handleOrders(order, initData);
    }

    // save data to redis
    await this.redisService.set(key, initData);
  }

  async saveEachOrderOfUserToRedis(orders: any, bookmakerId: number, userId: number) {
    for (const order of orders) {
      const keyOrdersOfBookmaker = OrderHelper.getKeyByBookmaker(bookmakerId.toString(), order);
      const dataByBookmakerId: any = await this.redisService.get(keyOrdersOfBookmaker);
      let initData: any = {};
      if (!dataByBookmakerId) {
        initData = {
          [`user-id-${userId}`]: {

          } as any,
        } as any;
      } else {
        initData = dataByBookmakerId as any;
      }
      const keyByOrder = OrderHelper.getKeyByOrder(order);
      if (!initData[`user-id-${userId}`]) {
        initData[`user-id-${userId}`] = {
          [keyByOrder]: this.transformOrderToObject(order)
        }
      } else {
        initData[`user-id-${userId}`][keyByOrder] = this.transformOrderToObject(order);
      }
      this.redisService.set(keyOrdersOfBookmaker, initData);
    }
  }

  transformOrderToObject(order: any) {
    // let str1;
    // let numbers1;
    // let str2;
    // let numbers2;
    // let str3;
    // let numbers3;
    // let str4;
    // let numbers4;
    // let numbers: any = [];

    const { numbers } = OrderHelper.getInfoDetailOfOrder(order);
    const result: any = {};

    for (const number of numbers) {
      let tempNumber = number;
      if (
        order.childBetType === LoXienType.Xien2
        || order.childBetType === LoXienType.Xien3
        || order.childBetType === LoXienType.Xien4
        || order.childBetType === LoTruocType.TruotXien4
        || order.childBetType === LoTruocType.TruotXien8
        || order.childBetType === LoTruocType.TruotXien10
      ) {
        tempNumber = JSON.parse(number);
        tempNumber = tempNumber.join(',');
      }
      result[tempNumber] = order.multiple;
    }

    return result;

    // try {
    //   str1 = order.detail.split('|')[0];
    //   numbers1 = str1.split(',');
    //   str2 = order.detail.split('|')[1];
    //   numbers2 = str2.split(',');
    //   str3 = order.detail.split('|')[2];
    //   numbers3 = str3.split(',');
    //   str4 = order.detail.split('|')[3];
    //   numbers4 = str4.split(',');
    // } catch (error) { }

    // switch (order.childBetType) {
    //   case BaoLoType.Lo2So:
    //   case BaoLoType.Lo2So1k:
    //   case DanhDeType.DeDau:
    //   case DanhDeType.DeDacBiet:
    //   case DanhDeType.DeDauDuoi:
    //     numbers = [];
    //     if ((order.detail.split('|').length - 1) === 1) {
    //       for (const n1 of numbers1) {
    //         for (const n2 of numbers2) {
    //           const number = `${n1.toString()}${n2.toString()}`;
    //           numbers.push(number);
    //         }
    //       }
    //     } else {
    //       numbers = order.detail.split(',');
    //     }
    //     break;

    //   case BaoLoType.Lo3So:
    //   case BaCangType.BaCangDau:
    //   case BaCangType.BaCangDacBiet:
    //   case BaCangType.BaCangDauDuoi:
    //     numbers = [];
    //     if ((order.detail.split('|').length - 1) === 2) {
    //       for (const n1 of numbers1) {
    //         for (const n2 of numbers2) {
    //           for (const n3 of numbers3) {
    //             const number = `${n1.toString()}${n2.toString()}${n3.toString()}`;
    //             numbers.push(number);
    //           }
    //         }
    //       }
    //     } else {
    //       numbers = order.detail.split(',');
    //     }
    //     break;

    //   case BaoLoType.Lo4So:
    //   case BonCangType.BonCangDacBiet:
    //     numbers = [];
    //     if ((order.detail.split('|').length - 1) === 3) {
    //       for (const n1 of numbers1) {
    //         for (const n2 of numbers2) {
    //           for (const n3 of numbers3) {
    //             for (const n4 of numbers4) {
    //               const number = `${n1.toString()}${n2.toString()}${n3.toString()}${n4.toString()}`;
    //               numbers.push(number);
    //             }
    //           }
    //         }
    //       }
    //     } else {
    //       numbers = order.detail.split(',');
    //     }
    //     break;

    //   case LoXienType.Xien2:
    //   case LoXienType.Xien3:
    //   case LoXienType.Xien4:
    //   case LoTruocType.TruotXien4:
    //   case LoTruocType.TruotXien8:
    //   case LoTruocType.TruotXien10:
    //     numbers = [order.detail];
    //     break;

    //   case DauDuoiType.Dau:
    //   case DauDuoiType.Duoi:
    //     numbers = order.detail.split(',');
    //     numbers = numbers.map((number: any) => number.trim());
    //     break;

    //   case TroChoiThuViType.Lo2SoGiaiDacBiet:
    //     numbers = [order.detail];
    //     break;

    //   default:
    //     break;
    // }

    // const result: any = {};

    // for (const number of numbers) {
    //   result[number] = order.multiple;
    // }

    // return result;
  }

  // handleOrders(order: any, initData: any) {
  //   if (!order) return initData;

  //   let str1;
  //   let numbers1;
  //   let str2;
  //   let numbers2;
  //   let str3;
  //   let numbers3;
  //   let str4;
  //   let numbers4;
  //   let numbers: string[] = [];

  //   try {
  //     str1 = order.detail.split('|')[0];
  //     numbers1 = str1.split(',');
  //     str2 = order.detail.split('|')[1];
  //     numbers2 = str2.split(',');
  //     str3 = order.detail.split('|')[2];
  //     numbers3 = str3.split(',');
  //     str4 = order.detail.split('|')[3];
  //     numbers4 = str4.split(',');
  //   } catch (error) { }

  //   switch (order.childBetType) {
  //     case BaoLoType.Lo2So:
  //     case BaoLoType.Lo2So1k:
  //     case DanhDeType.DeDau:
  //     case DanhDeType.DeDacBiet:
  //     case DanhDeType.DeDauDuoi:
  //       numbers = [];
  //       if ((order.detail.split('|').length - 1) === 1) {
  //         for (const n1 of numbers1) {
  //           for (const n2 of numbers2) {
  //             const number = `${n1.toString()}${n2.toString()}`;
  //             numbers.push(number);
  //           }
  //         }
  //       } else {
  //         numbers = order.detail.split(',');
  //       }

  //       for (const number of numbers) {
  //         this.addOrder({
  //           typeBet: order.betType,
  //           childBetType: order.childBetType,
  //           multiple: order.multiple,
  //           number,
  //           initData,
  //         });
  //       }
  //       break;

  //     case BaoLoType.Lo3So:
  //     case BaCangType.BaCangDau:
  //     case BaCangType.BaCangDacBiet:
  //     case BaCangType.BaCangDauDuoi:
  //       numbers = [];
  //       if ((order.detail.split('|').length - 1) === 2) {
  //         for (const n1 of numbers1) {
  //           for (const n2 of numbers2) {
  //             for (const n3 of numbers3) {
  //               const number = `${n1.toString()}${n2.toString()}${n3.toString()}`;
  //               numbers.push(number);
  //             }
  //           }
  //         }
  //       } else {
  //         numbers = order.detail.split(',');
  //       }

  //       for (const number of numbers) {
  //         this.addOrder({
  //           typeBet: order.betType,
  //           childBetType: order.childBetType,
  //           multiple: order.multiple,
  //           number,
  //           initData,
  //         });
  //       }
  //       break;

  //     case BaoLoType.Lo4So:
  //     case BonCangType.BonCangDacBiet:
  //       numbers = [];
  //       if ((order.detail.split('|').length - 1) === 3) {
  //         for (const n1 of numbers1) {
  //           for (const n2 of numbers2) {
  //             for (const n3 of numbers3) {
  //               for (const n4 of numbers4) {
  //                 const number = `${n1.toString()}${n2.toString()}${n3.toString()}${n4.toString()}`;
  //                 numbers.push(number);
  //               }
  //             }
  //           }
  //         }
  //       } else {
  //         numbers = order.detail.split(',');
  //       }
  //       for (const number of numbers) {
  //         this.addOrder({
  //           typeBet: order.betType,
  //           childBetType: order.childBetType,
  //           multiple: order.multiple,
  //           number,
  //           initData,
  //         });
  //       }
  //       break;

  //     case LoXienType.Xien2:
  //     case LoXienType.Xien3:
  //     case LoXienType.Xien4:
  //     case LoTruocType.TruotXien4:
  //     case LoTruocType.TruotXien8:
  //     case LoTruocType.TruotXien10:
  //       numbers = order.detail.split(',');
  //       numbers = numbers.map(number => number.trim());
  //       numbers.sort((a: string, b: string) => {
  //         return parseInt(a) - parseInt(b);
  //       });
  //       this.addOrder({
  //         typeBet: order.betType,
  //         childBetType: order.childBetType,
  //         multiple: order.multiple,
  //         number: JSON.stringify(numbers),
  //         initData,
  //       });
  //       break;

  //     case DauDuoiType.Dau:
  //     case DauDuoiType.Duoi:
  //       numbers = order.detail.split(',');
  //       numbers = numbers.map(number => number.trim());
  //       for (const number of numbers) {
  //         this.addOrder({
  //           typeBet: order.betType,
  //           childBetType: order.childBetType,
  //           multiple: order.multiple,
  //           number,
  //           initData,
  //         });
  //       }
  //       break;

  //     case TroChoiThuViType.Lo2SoGiaiDacBiet:
  //       this.addOrder({
  //         typeBet: order.betType,
  //         childBetType: order.childBetType,
  //         multiple: order.multiple,
  //         number: order.detail.toString(),
  //         initData,
  //       });
  //       break;

  //     default:
  //       break;
  //   }

  //   return initData;
  // }

  // addOrder({ typeBet, childBetType, number, multiple, initData }: any) {
  //   let multipleTemp;
  //   if (initData[typeBet][childBetType][number]) {
  //     multipleTemp = initData[typeBet][childBetType][number] + multiple;
  //     initData[typeBet][childBetType][number] = multipleTemp;
  //   } else {
  //     multipleTemp = multiple;
  //   }

  //   initData[typeBet][childBetType][number] = multipleTemp;
  // }

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
        [CategoryLotteryType.LoXien]: {
          [LoXienType.Xien2]: {

          } as any,
          [LoXienType.Xien3]: {

          } as any,
          [LoXienType.Xien4]: {

          } as any,
        },
        [CategoryLotteryType.LoTruot]: {
          [LoTruocType.TruotXien4]: {

          } as any,
          [LoTruocType.TruotXien8]: {

          } as any,
          [LoTruocType.TruotXien10]: {

          } as any,
        },
        [CategoryLotteryType.TroChoiThuVi]: {
          [TroChoiThuViType.Lo2SoGiaiDacBiet]: {

          } as any,
        },
      };
    }

    return data;
  }

  // getBalance(orders: any) {
  //   let totalBet = 0;
  //   for (const order of orders) {
  //     const { numberOfBets } = OrderHelper.getInfoDetailOfOrder(order);
  //     let amount = 0;

  //     switch (order.childBetType) {
  //       case BaoLoType.Lo3So:
  //         amount = (numberOfBets * PricePerScore.Lo3So) * order.multiple;
  //         break;

  //       case BaoLoType.Lo2So:
  //         amount = (numberOfBets * PricePerScore.Lo2So) * order.multiple;
  //         break;

  //       case BaoLoType.Lo2So1k:
  //         amount = (numberOfBets * PricePerScore.Lo2So1k) * order.multiple;
  //         break;

  //       case BaoLoType.Lo4So:
  //         amount = (numberOfBets * PricePerScore.Lo4So) * order.multiple;
  //         break;

  //       case DanhDeType.DeDau:
  //         amount = (numberOfBets * PricePerScore.DeDau) * order.multiple;
  //         break;

  //       case DanhDeType.DeDacBiet:
  //         amount = (numberOfBets * PricePerScore.DeDacBiet) * order.multiple;
  //         break;

  //       case DanhDeType.DeDauDuoi:
  //         amount = (numberOfBets * PricePerScore.DeDauDuoi) * order.multiple;
  //         break;

  //       case BaCangType.BaCangDau:
  //         amount = (numberOfBets * PricePerScore.BaCangDau) * order.multiple;
  //         break;

  //       case BaCangType.BaCangDacBiet:
  //         amount = (numberOfBets * PricePerScore.BaCangDacBiet) * order.multiple;
  //         break;

  //       case BaCangType.BaCangDauDuoi:
  //         amount = (numberOfBets * PricePerScore.BaCangDauDuoi) * order.multiple;
  //         break;

  //       case BonCangType.BonCangDacBiet:
  //         amount = (numberOfBets * PricePerScore.BonCangDacBiet) * order.multiple;
  //         break;

  //       case LoXienType.Xien2:
  //         amount = (numberOfBets * PricePerScore.Xien2) * order.multiple;
  //         break;

  //       case LoXienType.Xien3:
  //         amount = (numberOfBets * PricePerScore.Xien3) * order.multiple;
  //         break;

  //       case LoXienType.Xien4:
  //         amount = (numberOfBets * PricePerScore.Xien4) * order.multiple;
  //         break;

  //       case LoTruocType.TruotXien4:
  //         amount = (numberOfBets * PricePerScore.TruotXien4) * order.multiple;
  //         break;

  //       case LoTruocType.TruotXien8:
  //         amount = (numberOfBets * PricePerScore.TruotXien8) * order.multiple;
  //         break;

  //       case LoTruocType.TruotXien10:
  //         amount = (numberOfBets * PricePerScore.TruotXien10) * order.multiple;
  //         break;

  //       case TroChoiThuViType.Lo2SoGiaiDacBiet:
  //         amount = (numberOfBets * PricePerScore.TroChoiThuVi) * order.multiple;
  //         break;

  //       default:
  //         break;
  //     }

  //     totalBet += amount;
  //   }

  //   return totalBet;
  // }
}
