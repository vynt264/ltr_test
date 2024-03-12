import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
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
import { ERROR, ORDER_STATUS, PERIOD_CANNOT_CANCELED, PERIOD_CANNOT_ORDER, START_TIME_CREATE_JOB } from 'src/system/constants';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';
import { LotteryAwardService } from '../lottery.award/lottery.award.service';
import { DateTimeHelper } from 'src/helpers/date-time';
import { OrderValidate } from './validations/order.validate';
import { OrderHelper } from 'src/common/helper';
import { HoldingNumbersService } from '../holding-numbers/holding-numbers.service';
import { WalletHistory } from '../wallet/wallet.history.entity';
import { LotteriesService } from '../lotteries/lotteries.service';
import { WinningNumbersService } from '../winning-numbers/winning-numbers.service';
import { Logger } from 'winston';
import { SocketGatewayService } from '../gateway/gateway.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRequestRepository: Repository<Order>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,
    private readonly redisService: RedisCacheService,
    private readonly walletHandlerService: WalletHandlerService,
    private readonly lotteryAwardService: LotteryAwardService,
    private readonly holdingNumbersService: HoldingNumbersService,
    private readonly lotteriesService: LotteriesService,
    private readonly winningNumbersService: WinningNumbersService,
    private readonly socketGateway: SocketGatewayService,
    @Inject("winston")
    private readonly logger: Logger,
  ) { }

  async create(data: CreateListOrdersDto, member: any) {
    if (!data || !data?.orders || data.orders.length === 0) return;

    // prevent time order
    const seconds = OrderHelper.getPlayingTimeByType(data?.orders?.[0]?.type);
    const currentTime = OrderHelper.getCurrentTimeInRound(seconds);
    await OrderHelper.isValidTimeOrder(currentTime, seconds);

    // validate orders
    let isTestPlayer = false;
    if (member.usernameReal) {
      isTestPlayer = true;
    }
    const turnIndex = OrderHelper.getTurnIndex(seconds);
    const ordersBefore = await this.getOrdersBeforeInTurn(data.orders, turnIndex, isTestPlayer);
    await OrderValidate.validateOrders(data?.orders || [], ordersBefore, turnIndex);

    const openTime = OrderHelper.getOpenTime(seconds);
    const closeTime = OrderHelper.getCloseTime(seconds);

    // check balance
    const wallet = await this.walletHandlerService.findWalletByUserId(member.id);
    const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(member.id.toString()));
    const totalBet = OrderHelper.getBalance(data.orders);
    await this.checkBalance(totalBet, { balance });

    let promises = [];
    const bookmakerId = member?.bookmakerId || 1;
    // await this.prepareDataToGenerateAward(data.orders, bookmakerId, turnIndex, member.usernameReal);

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
      order.openTime = openTime.toString();
      order.closeTime = closeTime.toString();

      promises.push(this.orderRequestRepository.save(order));
    }

    if (promises.length === 0) return;

    const result = await Promise.all(promises);

    await this.prepareDataToGeneratePrizes(result, bookmakerId, turnIndex, member.usernameReal);
    await this.saveOrdersOfUserToRedis(result, bookmakerId, member.id, member.usernameReal);

    // update balance
    // const totalBetRemain = Number(balance) - totalBet;
    const totalBetRemain = await this.redisService.incrby(OrderHelper.getKeySaveBalanceOfUser(member.id.toString()), -(Number(totalBet)));
    await this.walletHandlerService.update(wallet.id, { balance: totalBetRemain });

    // save wallet history
    const createWalletHis: any = {
      id: wallet.id,
      user: { id: member.id },
      subOrAdd: 0,
      amount: totalBet,
      detail: `Xổ số nhanh - Trừ tiền cược`,
      balance: totalBetRemain,
      createdBy: member.name,
    }
    const createdWalletHis = await this.walletHistoryRepository.create(createWalletHis);
    await this.walletHistoryRepository.save(createdWalletHis);

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
      isDeleted: false,
    };
    const conditionCalcAllOrders: any = {
      userId: member.id,
      isDeleted: false,
    };

    let query = 'orders.userId = :userId ';
    if (status) {
      conditionGetOrders.status = status;
      conditionCalcAllOrders.status = status;
      query += `AND orders.status = :status `;
    }
    if (fromD && toD) {
      const offset = 7 * 60 * 60 * 1000;
      conditionGetOrders.createdAt = Between(fromD, toD);
      const tempFromD = new Date(fromD.getTime() + offset);
      conditionCalcAllOrders.fromD = tempFromD.toISOString();
      const tempToD = new Date(toD.getTime() + offset);
      conditionCalcAllOrders.toD = tempToD.toISOString();
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

  async validationOrdersImmediate(data: CreateListOrdersDto, user: any) {
    if (!data || !data?.orders || data.orders.length === 0) return;

    // validate orders
    const seconds = OrderHelper.getPlayingTimeByType(data?.orders?.[0]?.type);
    const turnIndex = OrderHelper.getTurnIndex(seconds);
    await OrderValidate.validateOrders(data?.orders || [], [], turnIndex);

    // check balance
    let wallet = await this.walletHandlerService.findWalletByUserId(user.id);
    const totalBet = OrderHelper.getBalance(data.orders);
    const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()));
    await this.checkBalance(totalBet, { balance });

    // update balance
    // wallet = await this.walletHandlerService.findWalletByUserId(user.id);
    // const totalBetRemain = Number(balance) - totalBet;
    const totalBetRemain = await this.redisService.incrby(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()), -Number(totalBet));
    await this.walletHandlerService.updateWalletByUserId(user.id, { balance: totalBetRemain });

    // save wallet history
    const createWalletHis: any = {
      id: wallet.id,
      user: { id: user.id },
      subOrAdd: 0,
      amount: totalBet,
      detail: `Xổ số nhanh - Trừ tiền cược`,
      balance: (totalBetRemain),
      createdBy: user.name,
    }
    const createdWalletHis = this.walletHistoryRepository.create(createWalletHis);
    this.walletHistoryRepository.save(createdWalletHis);

    return {
      balance: (totalBetRemain),
    };
  }

  async betOrdersImmediate(data: CreateListOrdersDto, user: any) {
    if (!data || !data?.orders || data.orders.length === 0) return;

    const openTime = new Date();
    const seconds = OrderHelper.getPlayingTimeByType(data?.orders?.[0]?.type);
    const turnIndex = OrderHelper.getTurnIndex(seconds);
    // let wallet = await this.walletHandlerService.findWalletByUserId(user.id);
    const totalBet = OrderHelper.getBalance(data.orders);

    let promises = [];
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
      order.user = user;
      order.bookMaker = { id: user.bookmakerId } as any;
      if (user.usernameReal) {
        order.isTestPlayer = true;
      }

      promises.push(this.orderRequestRepository.save(order));
    }

    if (promises.length === 0) return;

    const result = await Promise.all(promises);

    let initData = OrderHelper.initData();
    initData = this.getDataToGenerateAward(result, initData);
    const dataTransform = OrderHelper.transformData(initData);
    let isTestPlayer = false;
    if (user.usernameReal) {
      isTestPlayer = true;
    }
    const {
      prizes,
      totalRevenue,
      totalPayout,
      bonusPrice,
      totalProfit,
    } = await this.lotteriesService.handlerPrizes({
      type: `${data.orders[0].type}${data.orders[0].seconds}s`,
      data: dataTransform,
      isTestPlayer,
    });
    const finalResult = OrderHelper.randomPrizes(prizes);

    // create lottery award
    this.lotteryAwardService.createLotteryAward({
      turnIndex,
      type: `${data.orders[0].type}${seconds}s`,
      awardDetail: JSON.stringify(finalResult),
      bookmaker: { id: user.bookmakerId } as any,
      isTestPlayer,
      openTime,
      createdAt: openTime,
      userId: user.id,
      totalRevenue,
      totalPayout,
      bonusPrice,
      totalProfit,
    });

    const promisesCreateWinningNumbers = [];
    const promisesUpdatedOrders = [];
    let totalBalance = 0;
    const ordersWin = [];
    for (const order of result) {
      const objOrder = this.transformOrderToObject(order);
      const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
        orders: objOrder,
        childBetType: data.orders[0].childBetType,
        prizes: finalResult,
      });

      totalBalance += winningAmount;

      if (realWinningAmount > 0) {
        ordersWin.push({
          typeBetName: OrderHelper.getCategoryLotteryTypeName(order.betType),
          childBetType: OrderHelper.getChildBetTypeName(order.childBetType),
          orderId: order.id,
          type: `${order.type}${order.seconds}s`,
          amount: realWinningAmount,
        });
      }

      if (winningNumbers.length > 0) {
        promisesCreateWinningNumbers.push(
          this.winningNumbersService.create({
            winningNumbers: JSON.stringify(winningNumbers),
            turnIndex,
            order: {
              id: order.id
            } as any,
            type: data.orders[0].type,
            isTestPlayer,
          }),
        );
      }

      promisesUpdatedOrders.push(this.update(
        +order.id,
        {
          paymentWin: realWinningAmount,
          status: ORDER_STATUS.closed,
        },
        null,
      ));
    }

    // save winning numbers
    Promise.all(promisesCreateWinningNumbers);
    // update status orders
    await Promise.all(promisesUpdatedOrders);

    // update balance

    // const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()));
    // const remainBalance = Number(balance) + totalBalance + refunds;
    const wallet = await this.walletHandlerService.findWalletByUserId(user.id);
    // const remainBalance = Number(balance) + totalBalance;
    const remainBalance = await this.redisService.incrby(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()), Number(totalBalance));
    await this.walletHandlerService.updateWalletByUserId(user.id, { balance: remainBalance });

    // save wallet history
    const createWalletHisWin: any = {
      id: wallet.id,
      user: { id: user.id },
      subOrAdd: 1,
      amount: totalBalance,
      detail: `Xổ số nhanh - Cộng tiền thắng`,
      balance: remainBalance,
      createdBy: user.name
    }
    const createdWalletHisWin = await this.walletHistoryRepository.create(createWalletHisWin);
    this.walletHistoryRepository.save(createdWalletHisWin);

    return {
      ordersWin,
      type: `${data.orders[0].type}${seconds}s`,
      awardDetail: finalResult,
      openTime: turnIndex.split('-')[1],
      balance: remainBalance,
    };
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
      relations: ["holdingNumber"],
      where: {
        id,
      },
    });
  }

  async removeOrderFromRedis({
    order,
    bookmakerId,
    userId,
    usernameReal,
  }: any) {
    let keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), `${order.type}${order.seconds}s`);
    if (usernameReal) {
      keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), `${order.type}${order.seconds}s`);
    }
    const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), order.turnIndex);
    const mergeKey = `${keyOrdersOfBookmaker}-${keyByUserAndTurnIndex}-cancel-orders`;
    const keyByOrder = OrderHelper.getKeySaveEachOrder(order);
    const data = this.transformOrderToObject(order);
    await this.redisService.hset(`${mergeKey}`, `${keyByOrder}`, JSON.stringify(data));

    // remove order from data prepare to generate award
    let key = OrderHelper.getKeyCancelOrders(bookmakerId, `${order.type}${order.seconds}s`, order.turnIndex);
    if (usernameReal) {
      key = OrderHelper.getKeyCancelOrdersOfTestPlayer(bookmakerId, `${order.type}${order.seconds}s`, order.turnIndex);
    }

    const { numbers } = OrderHelper.getInfoDetailOfOrder(order);
    const result: any = {};
    for (const num of numbers) {
      result[num] = order.multiple
    }

    return this.redisService.hset(`${key}`, `${order.id}-${order.betType}-${order.childBetType}`, JSON.stringify(result));
  }

  async update(id: number, updateOrderDto: any, member: any) {
    let order = await this.orderRequestRepository.findOne({
      where: {
        id,
      },
    });

    if (member) {
      const numberRequest = await this.redisService.incr(id.toString());
      if (numberRequest > 1) return;

      setTimeout(() => {
        this.redisService.del(id);
      }, 3000)

      const currentTime = OrderHelper.getCurrentTimeInRound(order.seconds);
      if ((order.seconds - currentTime) < PERIOD_CANNOT_CANCELED) {
        throw new HttpException(
          {
            message: ERROR.MESSAGE_NOT_CANCEL,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.removeOrderFromRedis({
        order,
        bookmakerId: member.bookmakerId,
        userId: member.id,
        usernameReal: member.usernameReal,
      });

      const wallet = await this.walletHandlerService.findWalletByUserId(member.id);
      // const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(member.id.toString()));
      // const remainBalance = +balance + (+order.revenue);
      const remainBalance = await this.redisService.incrby(OrderHelper.getKeySaveBalanceOfUser(member.id.toString()), Number(order.revenue));
      await this.walletHandlerService.updateWalletByUserId(+member.id, { balance: remainBalance });
      // save wallet history
      const createWalletHis: any = {
        id: wallet.id,
        user: { id: member.id },
        subOrAdd: 1,
        amount: +order.revenue,
        detail: `Xổ số nhanh - Hoàn tiền cược`,
        balance: remainBalance,
        createdBy: member.name
      }
      const createdWalletHis = await this.walletHistoryRepository.create(createWalletHis);
      await this.walletHistoryRepository.save(createdWalletHis);
    }

    if (order.status !== ORDER_STATUS.pending) return;

    return this.orderRequestRepository.update(id, updateOrderDto);
  }

  delete(id: number) {
    return this.orderRequestRepository.update(id, { isDeleted: true });
  }

  remove(id: number) {
    return this.orderRequestRepository.delete(id);
  }

  async getCurrentTurnIndex(query: { seconds: string, type: string, isTestPlayerClient: boolean }, user: any) {
    if (!query.seconds) {
      return {};
    }
    const startTime = startOfDay(new Date());
    const fromDate = addHours(startTime, START_TIME_CREATE_JOB).getTime();
    const toDate = (new Date()).getTime();
    const numberOfTurn = Math.floor(((toDate - fromDate) / 1000) / parseInt(query.seconds));
    const secondsInCurrentRound = (toDate / 1000) % parseInt(query.seconds);
    const openTime = toDate - (secondsInCurrentRound * 1000);
    let isTestPlayer = false;
    if (user?.usernameReal) {
      isTestPlayer = true;
    }
    if (query.isTestPlayerClient) {
      isTestPlayer = query.isTestPlayerClient;
    }

    const tempNumberOfTurn = OrderHelper.getFullCharOfTurn(numberOfTurn.toString());
    const nextTurnIndex = OrderHelper.getFullCharOfTurn((numberOfTurn + 1).toString());
    const lotteryAward = await this.lotteryAwardService.getLotteryAwardByTurnIndex(`${DateTimeHelper.formatDate(new Date())}-${tempNumberOfTurn}`, query.type, isTestPlayer);

    return {
      turnIndex: `${DateTimeHelper.formatDate(new Date())}-${tempNumberOfTurn}`,
      nextTurnIndex: `${DateTimeHelper.formatDate(new Date())}-${nextTurnIndex}`,
      openTime: toDate - (secondsInCurrentRound * 1000),
      nextTime: openTime + (parseInt(query.seconds) * 1000),
      awardDetail: lotteryAward?.awardDetail || {},
    };
  }

  async generateFollowUpPlan(
    {
      boiSo,
      cachLuot,
      nhieuX,
      soLuot,
      order,
    }: {
      boiSo: number,
      cachLuot: number,
      nhieuX: number,
      soLuot: number,
      order: any,
    },
    user: any,
  ) {
    const wallet = await this.walletHandlerService.findWalletByUserId(user.id);
    const seconds = OrderHelper.getPlayingTimeByType(order.type);
    const currentIndex = OrderHelper.getCurrentTurnIndex(seconds);
    const { numberOfBets } = OrderHelper.getInfoDetailOfOrder(order);
    const result: any = [];
    let currentBoiSo = boiSo;
    let openTime = OrderHelper.getOpenTime(seconds);
    let nextTurnIndex = Number(currentIndex);
    let totalAmount = 0;
    let isValidAmount = false;
    let count = 0;

    for (let i = 1; i <= soLuot; i++) {
      if (i === 1) {
        currentBoiSo = currentBoiSo * 1;
      } else {
        currentBoiSo = currentBoiSo * nhieuX;
        nextTurnIndex += 1;
        openTime += (seconds * 1000);
      }
      const tempBetAmount = OrderHelper.getBetAmount(currentBoiSo, order.childBetType, numberOfBets);

      // check wallet
      if ((totalAmount + tempBetAmount) > wallet.balance) {
        isValidAmount = true;
        break;
      } else {
        count++;
        totalAmount += tempBetAmount;
      }

      result.push({
        openTime,
        turnIndex: `${DateTimeHelper.formatDate(new Date())}-${OrderHelper.getFullCharOfTurn(nextTurnIndex.toString())}`,
        multiple: currentBoiSo,
        betAmount: tempBetAmount,
      });

      if (cachLuot > 1) {
        for (let j = 1; j < cachLuot; j++) {
          openTime += (seconds * 1000);
          nextTurnIndex += 1;
          result.push({
            openTime,
            turnIndex: `${DateTimeHelper.formatDate(new Date())}-${OrderHelper.getFullCharOfTurn(nextTurnIndex.toString())}`,
            multiple: 0,
            betAmount: 0,
          });
        }
      }
    }

    return {
      orders: result,
      totalAmount,
      totalTurns: count,
      isValidAmount,
    };
  }

  async confirmGenerateFollowUpPlan(data: any, user: any) {
    // prevent time order
    const seconds = OrderHelper.getPlayingTimeByType(data?.orders?.[0]?.type);
    const currentTime = OrderHelper.getCurrentTimeInRound(seconds);
    await OrderHelper.isValidTimeOrder(currentTime, seconds);

    // validate orders
    let isTestPlayer = false;
    if (user.usernameReal) {
      isTestPlayer = true;
    }
    const turnIndex = OrderHelper.getTurnIndex(seconds);
    const ordersBefore = await this.getOrdersBeforeInTurn(data.orders, turnIndex, isTestPlayer);
    await OrderValidate.validateOrders(data?.orders || [], ordersBefore, turnIndex);

    // check balance
    const wallet = await this.walletHandlerService.findWalletByUserId(user.id);
    const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()));
    const totalBet = OrderHelper.getBalance(data.orders);
    await this.checkBalance(totalBet, { balance });

    const result: any = [];
    const orders = data?.orders || [];
    const isStop = data?.isStop || false;
    const holdingNumber = await this.holdingNumbersService.create({
      isStop,
      name: "duplicated",
    });
    const promisesPrepareDataToGenerateAward = [];
    for (const order of orders) {
      // promisesPrepareDataToGenerateAward.push(this.prepareDataToGenerateAward([order], user.bookmakerId, order.turnIndex, user.usernameReal));

      order.openTime = OrderHelper.getOpenTimeByTurnIndex(order.turnIndex, seconds);
      order.closeTime = order.openTime + (seconds * 1000);
      order.numericalOrder = OrderHelper.getRandomTradingCode();
      const { betTypeName, childBetTypeName, numberOfBets } = OrderHelper.getInfoDetailOfOrder(order);
      order.seconds = OrderHelper.getPlayingTimeByType(order.type);
      order.type = OrderHelper.getTypeLottery(order.type);
      order.revenue = OrderHelper.getBetAmount(order.multiple, order.childBetType, numberOfBets);
      order.betTypeName = betTypeName;
      order.childBetTypeName = childBetTypeName;
      order.numberOfBets = numberOfBets;
      order.user = user;
      order.bookMaker = { id: user.bookmakerId } as any;
      order.holdingNumber = { id: holdingNumber.id } as any;
      if (user.usernameReal) {
        order.isTestPlayer = true;
      }

      const resultEachOrder = await this.orderRequestRepository.save(order);
      promisesPrepareDataToGenerateAward.push(this.prepareDataToGeneratePrizes([resultEachOrder], user.bookmakerId, order.turnIndex, user.usernameReal));
      result.push(resultEachOrder);
    }

    await Promise.all(promisesPrepareDataToGenerateAward);
    await this.saveOrdersOfUserToRedis(result, user.bookmakerId, user.id, user.usernameReal);

    // update balance
    // const totalBetRemain = Number(balance) - totalBet;
    const totalBetRemain  = await this.redisService.incrby(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()), -Number(totalBet));
    await this.walletHandlerService.update(wallet.id, { balance: totalBetRemain });

    // save wallet history
    const createWalletHis: any = {
      id: wallet.id,
      user: { id: user.id },
      subOrAdd: 0,
      amount: totalBet,
      detail: `Xổ số nhanh - Trừ tiền cược`,
      balance: totalBetRemain,
      createdBy: user.name,
    }
    const createdWalletHis = await this.walletHistoryRepository.create(createWalletHis);
    this.walletHistoryRepository.save(createdWalletHis);

    return result;
  }

  async findOrdersByHoldingNumberId(holdingNumberId: number) {
    return this.orderRequestRepository.find({
      where: {
        holdingNumber: { id: holdingNumberId },
        isDeleted: false,
      },
    });
  }

  async prepareDataToGenerateAward(orders: any, bookmakerId: string, turnIndex: string, usernameReal: string) {
    if (!orders || orders.length === 0) return;

    let key = OrderHelper.getKeyPrepareOrders(bookmakerId, orders[0]?.type, turnIndex);
    if (usernameReal) {
      key = OrderHelper.getKeyPrepareOrdersOfTestPlayer(bookmakerId, orders[0]?.type, turnIndex);
    }
    let initData = await this.redisService.get(key);
    if (!initData) {
      initData = OrderHelper.initData();
    }

    initData = this.getDataToGenerateAward(orders, initData);
    // save data to redis
    await this.redisService.set(key, initData);
  }

  async prepareDataToGeneratePrizes(orders: any, bookmakerId: string, turnIndex: string, usernameReal: string) {
    if (!orders || orders.length === 0) return;

    let key = OrderHelper.getKeyPrepareOrders(bookmakerId, `${orders[0]?.type}${orders[0].seconds}s`, turnIndex);
    if (usernameReal) {
      key = OrderHelper.getKeyPrepareOrdersOfTestPlayer(bookmakerId, orders[0]?.type, turnIndex);
    }

    const promises = [];
    for (const order of orders) {
      const { numbers } = OrderHelper.getInfoDetailOfOrder(order);
      const result: any = {};
      for (const num of numbers) {
        result[num] = order.multiple
      }
      promises.push(this.redisService.hset(`${key}`, `${order.id}-${order.betType}-${order.childBetType}`, JSON.stringify(result)));
    }

    return await Promise.all(promises);
  }

  getDataToGenerateAward(orders: any, initData: any) {
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

    return initData;
  }

  async saveEachOrderOfUserToRedis(orders: any, bookmakerId: number, userId: number, usernameReal: string) {
    const type = orders?.[0]?.type;
    const seconds = orders?.[0].seconds;
    let keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), `${type}${seconds}s`);
    if (usernameReal) {
      keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), `${type}${seconds}s`);
    }

    let dataByBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);
    if (!dataByBookmaker) {
      dataByBookmaker = {};
    }
    for (const order of orders) {
      const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), order.turnIndex);
      if (Object.keys(dataByBookmaker).length === 0) {
        dataByBookmaker[keyByUserAndTurnIndex] = {} as any;
      }
      const keyByOrder = OrderHelper.getKeySaveEachOrder(order);
      if (!dataByBookmaker[keyByUserAndTurnIndex]) {
        dataByBookmaker[keyByUserAndTurnIndex] = {
          [keyByOrder]: this.transformOrderToObject(order)
        }
      } else {
        dataByBookmaker[keyByUserAndTurnIndex][keyByOrder] = this.transformOrderToObject(order);
      }
    }
    this.redisService.set(keyOrdersOfBookmaker, dataByBookmaker);
  }

  async saveOrdersOfUserToRedis(orders: any, bookmakerId: number, userId: number, usernameReal: string) {
    const type = orders?.[0]?.type;
    const seconds = orders?.[0].seconds;
    let keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), `${type}${seconds}s`);
    if (usernameReal) {
      keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), `${type}${seconds}s`);
    }

    // let dataByBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);
    // if (!dataByBookmaker) {
    //   dataByBookmaker = {};
    // }

    const promises = [];
    let keyByUserAndTurnIndex;
    for (const order of orders) {
      keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), order.turnIndex);
      const mergeKey = `${keyOrdersOfBookmaker}-${keyByUserAndTurnIndex}`;
      const keyByOrder = OrderHelper.getKeySaveEachOrder(order);
      const data = this.transformOrderToObject(order);

      promises.push(this.redisService.hset(`${mergeKey}`, `${keyByOrder}`, JSON.stringify(data)));


      // if (!dataByBookmaker[keyByUserAndTurnIndex]) {
      //   dataByBookmaker[keyByUserAndTurnIndex] = {
      //     [keyByOrder]: this.transformOrderToObject(order)
      //   }
      // } else {
      //   dataByBookmaker[keyByUserAndTurnIndex][keyByOrder] = this.transformOrderToObject(order);
      // }
    }

    return Promise.all(promises);
    // const mergeKey1 = `${keyOrdersOfBookmaker}-${keyByUserAndTurnIndex}-t`;
    // const result = await this.redisService.hgetall(mergeKey1);
    // this.redisService.set(keyOrdersOfBookmaker, dataByBookmaker);
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

  initData() {
    let data = {
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

    return data;
  }

  getNumberOfBetsFromTurnIndex(order: any, turnIndex: string, isTestPlayer: boolean) {
    const seconds = OrderHelper.getPlayingTimeByType(order.type);
    const type = OrderHelper.getTypeLottery(order.type);
    return this.orderRequestRepository.find({
      where: {
        isTestPlayer,
        turnIndex,
        type,
        seconds,
        status: ORDER_STATUS.pending,
        childBetType: order.childBetType,
      },
    });
  }

  async checkBalance(totalBet: number, wallet: any) {
    if (totalBet > wallet.balance) {
      throw new HttpException(
        {
          message: ERROR.ACCOUNT_BALANCE_IS_INSUFFICIENT,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getOrdersBeforeInTurn(orders: any, turnIndex: string, isTestPlayer: boolean) {
    if (!orders) return [];

    const promises = [];
    for (const order of orders) {
      promises.push(this.getNumberOfBetsFromTurnIndex(order, turnIndex, isTestPlayer));
    }
    const result = await Promise.all(promises);

    return result.reduce((init: any, currentValue: any) => {
      for (const order of currentValue) {
        init.push(order);
      }

      return init;
    }, []);
  }

  async handleBalance({
    turnIndex,
    prizes,
    gameType,
    user,
  }: any) {
    const userId = user.id;
    const isTestPlayer = user.usernameReal ? true : false;
    const bookmakerId = user.bookmakerId;

    // get orders of bookmaker by game type (example: sxmb45s)
    let keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), gameType);
    if (isTestPlayer) {
      keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), gameType);
    }

    const winningPlayerOrders = []; // order users thang cuoc.
    const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), turnIndex);
    const mergeKey = `${keyOrdersOfBookmakerAndGameType}-${keyByUserAndTurnIndex}`;
    const ordersOfUser = await this.redisService.hgetall(mergeKey);

    if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
      this.logger.info(`orders of userId ${keyOrdersOfBookmakerAndGameType}-${turnIndex} is not found.`);
      return;
    }

    const ordersCancel = await this.redisService.hgetall(`${mergeKey}-cancel-orders`);
    const promises = [];
    const promisesCreateWinningNumbers = [];
    const ordersWin = [];
    let totalBalance = 0;
    for (const key in ordersOfUser) {
      if (ordersCancel[key] && Object.keys(ordersCancel[key]).length > 0) continue;

      const [orderId, region, betType, childBetType] = key.split('-');
      const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
        orders: JSON.parse(ordersOfUser[key]),
        childBetType,
        prizes,
      });

      totalBalance += winningAmount;

      // user win vs order hien tai
      if (realWinningAmount > 0) {
        winningPlayerOrders.push(orderId);
        ordersWin.push({
          typeBetName: OrderHelper.getCategoryLotteryTypeName(betType),
          childBetType: OrderHelper.getChildBetTypeName(childBetType),
          orderId,
          type: region,
          amount: realWinningAmount,
        });
      }

      if (winningNumbers.length > 0) {
        promisesCreateWinningNumbers.push(
          this.winningNumbersService.create({
            winningNumbers: JSON.stringify(winningNumbers),
            turnIndex,
            order: {
              id: orderId
            } as any,
            type: gameType,
            isTestPlayer,
          }),
        );
      }

      promises.push(this.update(
        +orderId,
        {
          paymentWin: realWinningAmount,
          status: ORDER_STATUS.closed,
        },
        null,
      ));
    }

    // save winning numbers
    Promise.all(promisesCreateWinningNumbers);
    await Promise.all(promises);

    // check nuoi so
    const { refunds } = await this.handlerHoldingNumbers({
      winningPlayerOrders,
      bookmakerId,
      userId,
      usernameReal: isTestPlayer ? true : false,
    });

    const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
    // const balance = await this.redisService.get(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()));
    // const remainBalance = Number(balance) + totalBalance + refunds;
    const remainBalance = await this.redisService.incrby(OrderHelper.getKeySaveBalanceOfUser(user.id.toString()), Number(totalBalance + refunds));
    await this.walletHandlerService.updateWalletByUserId(+userId, { balance: remainBalance });

    if ((totalBalance + refunds) > 0) {
      // save wallet history
      const createWalletHis: any = {
        id: wallet.id,
        user: { id: Number(userId) },
        subOrAdd: 1,
        amount: totalBalance + refunds,
        detail: `Xổ số nhanh - Cộng tiền thắng`,
        balance: remainBalance,
        createdBy: ""
      }

      const createdWalletHis = await this.walletHistoryRepository.create(createWalletHis);
      await this.walletHistoryRepository.save(createdWalletHis);
    }

    if (isTestPlayer) {
      this.logger.info(`userId ${userId} test player send event payment`);
    } else {
      this.logger.info(`userId ${userId} send event payment`);
    }
    this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {
      ordersWin,
    });
  }

  async handlerHoldingNumbers({
    winningPlayerOrders,
    bookmakerId,
    userId,
    usernameReal,
  }: any) {
    let refunds = 0;

    if (!winningPlayerOrders || winningPlayerOrders.length === 0) return {
      refunds,
    };

    const promises = [];
    for (const orderId of winningPlayerOrders) {
      const order = await this.findOne(+orderId);
      if (!order?.holdingNumber?.id) continue;

      const holdingNumber = await this.holdingNumbersService.findOne(+order.holdingNumber.id);

      if (!holdingNumber.isStop) continue;

      const orders = await this.findOrdersByHoldingNumberId(holdingNumber.id);

      if (!orders || orders.length === 0) continue;

      // remove orders
      for (const order of orders) {
        const tempOrder = await this.findOne(order.id);
        if (tempOrder.status === ORDER_STATUS.canceled || tempOrder.status === ORDER_STATUS.closed) continue;

        refunds += Number(tempOrder.revenue);

        await this.removeOrderFromRedis({
          order,
          bookmakerId,
          userId,
          usernameReal,
        });

        promises.push(
          this.delete(order.id),
        );
      }
    }
    await Promise.all(promises);

    return {
      refunds,
    }
  }
}
