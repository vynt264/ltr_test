import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { endOfDay, startOfDay, addHours } from "date-fns";

import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { PaginationQueryDto } from 'src/common/common.dto';
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
    await this.prepareDataToGenerateAward(data.orders, bookmakerId, turnIndex, member.usernameReal);

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
      if (member.usernameReal) {
        order.isTestPlayer = true;
      }

      promises.push(this.orderRequestRepository.save(order));
    }

    if (promises.length === 0) return;

    const result = await Promise.all(promises);

    await this.saveEachOrderOfUserToRedis(result, bookmakerId, member.id, member.usernameReal);

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
    if (member.usernameReal) {
      conditionGetOrders.isTestPlayer = true;
      conditionCalcAllOrders.isTestPlayer = true;
      query += `AND orders.isTestPlayer = :isTestPlayer `;
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

    let isTestPlayer = false;
    if (member.usernameReal) {
      isTestPlayer = true;
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
          AND entity.isTestPlayer = ${isTestPlayer}
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
          AND entity.isTestPlayer = ${isTestPlayer}
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
      const keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(member.bookmakerId.toString(), `${order.type}${order.seconds}s`);
      const dataByBookmakerId: any = await this.redisService.get(keyOrdersOfBookmaker);
      if (dataByBookmakerId) {
        const result: any = {};
        const orders: any = dataByBookmakerId[`user-id-${member.id}`];
        for (const key in orders) {
          if (key === OrderHelper.getKeySaveEachOrder(order)) continue;
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

  async prepareDataToGenerateAward(orders: any, bookmakerId: string, turnIndex: string, usernameReal: string) {
    if (!orders || orders.length === 0) return;

    let key = OrderHelper.getKeyPrepareOrders(bookmakerId, orders[0]?.type, turnIndex);
    if (usernameReal) {
      key = OrderHelper.getKeyPrepareOrdersOfTestPlayer(bookmakerId, orders[0]?.type, turnIndex);
    }
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
    }

    // save data to redis
    await this.redisService.set(key, initData);
  }

  async saveEachOrderOfUserToRedis(orders: any, bookmakerId: number, userId: number, usernameReal: string) {
    for (const order of orders) {
      let keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), `${order.type}${order.seconds}s`);
      if (usernameReal) {
        keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), `${order.type}${order.seconds}s`);
      }
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
      const keyByOrder = OrderHelper.getKeySaveEachOrder(order);
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
}
