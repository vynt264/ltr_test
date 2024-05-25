import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/components/orders/entities/order.entity';
import { Repository } from 'typeorm';
import { addHours, endOfDay, startOfDay } from 'date-fns';
import { PlayHistoryHilo } from '../admin.hilo/entities/play.history.hilo.entity';
import { PlayHistoryPoker } from '../admin.poker/entities/play.history.poker.entity';
import { PlayHistoryKeno } from '../admin.keno/entities/play.history.keno.entity';
import { DateTimeHelper } from 'src/helpers/date-time';
import { OrderHelper } from 'src/common/helper';
import { User } from 'src/components/user/user.entity';
import { ALL_GAME_TYPES, CASINO_GAME_TYPES, GAMES } from 'src/system/constants/game';
import { BookmakerService } from '../bookmaker/bookmaker.service';
import { UserService } from 'src/components/user/user.service';
import { ValidateRightsService } from '../validate-rights/validate-rights.service';
import { RIGHTS } from 'src/system/constants/rights';

@Injectable()
export class StatisticService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(PlayHistoryHilo)
    private playHistoryHiloRepository: Repository<PlayHistoryHilo>,

    @InjectRepository(PlayHistoryPoker)
    private playHistoryPokerRepository: Repository<PlayHistoryPoker>,

    @InjectRepository(PlayHistoryKeno)
    private playHistoryKenoRepository: Repository<PlayHistoryKeno>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @Inject(forwardRef(() => BookmakerService))
    private bookmakerService: BookmakerService,

    @Inject(forwardRef(() => UserService))
    private userService: UserService,

    @Inject(forwardRef(() => ValidateRightsService))
    private validateRightsService: ValidateRightsService,
  ) { }

  async reportByBookmarker(query: any, user: any) {
    let month = query.month || '';
    const game = query.game;
    const gameType = query.gameType;
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    let bookmarkerId = query.bookmarkerId;
    const hasRight = await this.validateRightsService.hasRight({
      userId: user.id,
      rightsNeedCheck: [RIGHTS.AllowSearchFromBookmarker],
    });
    if (!hasRight) {
      bookmarkerId = user.bookmakerId;
    }
    const isTestPlayer = query.isTestPlayer || false;
    const searchBy = query.searchBy;

    if (!searchBy || !bookmarkerId || !game || !gameType) return {
      total: 0,
      nextPage: 0,
      prevPage: 0,
      lastPage: 0,
      currentPage: 0,
      ordersInfo: [],
    };

    let fromDate;
    let toDate;
    let total = 0;
    let dates: any = [];
    let lastPage = 0;
    let nextPage = 0;
    let prevPage = 0;
    let types = gameType.split(',');

    const bookmaker = await this.bookmakerService.getById(bookmarkerId);
    const bookmarkerName = bookmaker?.result?.name || '';

    if (searchBy === 'day') {
      dates = this.getNumberOfDay(query.fromDate, query.toDate);
      total = dates.length;
      lastPage = Math.ceil(total / limit);
      nextPage = page + 1 > lastPage ? null : page + 1;
      prevPage = page - 1 < 1 ? null : page - 1;
      dates = dates.slice(((page - 1) * limit), page * limit);

      if (!dates || dates.length === 0) return {
        total: 0,
        nextPage: 0,
        prevPage: 0,
        lastPage: 0,
        currentPage: 0,
        ordersInfo: [],
      };

      fromDate = dates[0];
      toDate = dates[dates.length - 1];
      fromDate = startOfDay(new Date(fromDate));
      toDate = endOfDay(new Date(toDate));
      fromDate = addHours(fromDate, 7);
      toDate = addHours(toDate, 7);
    } else {
      dates = this.getNumberOfDay(query.fromDate, query.toDate);
      const tempMonth: string[] = [];
      for (const date of dates) {
        const m = (new Date(date)).getMonth() + 1;
        const hasMonth = tempMonth.some((i: string) => i === m.toString());
        if (!hasMonth) tempMonth.push(m.toString());
      }

      month = tempMonth.join(',');
    }

    const { totalUsers, newUsers } = await this.numberOfUsers({
      searchBy,
      fromDate,
      toDate,
      month,
      isTestPlayer,
      bookmarkerId,
      game,
      gameType,
      dates,
    });
    const lotterryOrders = await this.getLotteryOrders({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    const hiloOrders = await this.getHiloOrders({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    const kenoOrders = await this.getKenoOrders({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    const pokerOrders = await this.getPokerOrders({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    let finalResult = this.mergeOrders({
      lotterryOrders,
      hiloOrders,
      pokerOrders,
      kenoOrders,
      dates,
      months: (month || '').split(','),
      searchBy,
    });
    finalResult = this.fillArraySpace({
      searchBy,
      dates,
      ordersResult: finalResult,
      months: (month || '').split(','),
      totalUsers,
      newUsers,
      bookmarkerName,
    });

    // let bookmarkerProfit = 0; //3852000
    // let paymentWin = 0; //-3660000
    // let totalBet = 0; //33412000
    // let count = 0; //38
    // for (const item of finalResult) {
    //   bookmarkerProfit += item.bookmarkerProfit;
    //   paymentWin += item.paymentWin;
    //   totalBet += item.totalBet;
    //   count += item.count;
    // }

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      currentPage: page,
      ordersInfo: finalResult,
    }
  }

  async reportByGame(query: any, user: any) {
    let month = query.month || '';
    const game = query.game;
    const gameType = query.gameType;
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    let bookmarkerId = query.bookmarkerId;
    const hasRight = await this.validateRightsService.hasRight({
      userId: user.id,
      rightsNeedCheck: [RIGHTS.AllowSearchFromBookmarker],
    });
    if (!hasRight) {
      bookmarkerId = user.bookmakerId;
    }
    const isTestPlayer = query.isTestPlayer || false;
    const searchBy = query.searchBy;

    if (!searchBy || !bookmarkerId || !game || !gameType) return {
      total: 0,
      nextPage: 0,
      prevPage: 0,
      lastPage: 0,
      currentPage: 0,
      ordersInfo: [],
    };

    let fromDate;
    let toDate;
    let total = 0;
    let dates: any = [];
    let lastPage = 0;
    let nextPage = 0;
    let prevPage = 0;
    let types = gameType.split(',');

    const bookmaker = await this.bookmakerService.getById(bookmarkerId);
    const bookmarkerName = bookmaker?.result?.name || '';

    if (searchBy === 'day') {
      dates = this.getNumberOfDay(query.fromDate, query.toDate);
      total = dates.length;
      lastPage = Math.ceil(total / limit);
      nextPage = page + 1 > lastPage ? null : page + 1;
      prevPage = page - 1 < 1 ? null : page - 1;
      dates = dates.slice(((page - 1) * limit), page * limit);

      if (!dates || dates.length === 0) return {
        total: 0,
        nextPage: 0,
        prevPage: 0,
        lastPage: 0,
        currentPage: 0,
        ordersInfo: [],
      };

      fromDate = dates[0];
      toDate = dates[dates.length - 1];
      fromDate = startOfDay(new Date(fromDate));
      toDate = endOfDay(new Date(toDate));
      fromDate = addHours(fromDate, 7);
      toDate = addHours(toDate, 7);
    } else {
      dates = this.getNumberOfDay(query.fromDate, query.toDate);
      const tempMonth: string[] = [];
      for (const date of dates) {
        const m = (new Date(date)).getMonth() + 1;
        const hasMonth = tempMonth.some((i: string) => i === m.toString());
        if (!hasMonth) tempMonth.push(m.toString());
      }

      month = tempMonth.join(',');
    }

    const { totalUsers, newUsers } = await this.numberOfUsers({
      searchBy,
      fromDate,
      toDate,
      month,
      isTestPlayer,
      bookmarkerId,
      game,
      gameType,
      dates,
    });
    const lotterryOrders = await this.getLotteryOrdersByGame({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    const hiloOrders = await this.getHiloOrdersByGame({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    const kenoOrders = await this.getKenoOrdersByGame({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    const pokerOrders = await this.getPokerOrdersByGame({
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    });
    let finalResult = this.mergeOrdersByGame({
      lotterryOrders,
      hiloOrders,
      pokerOrders,
      kenoOrders,
      dates,
      months: (month || '').split(','),
      searchBy,
    });
    finalResult = this.fillArraySpaceByGame({
      searchBy,
      dates,
      ordersResult: finalResult,
      months: (month || '').split(','),
      totalUsers,
      newUsers,
      bookmarkerName,
    });

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      currentPage: page,
      ordersInfo: finalResult,
    }
  }

  async reportByUser(query: any, member: any) {
    const game = query.game;
    const gameType = query.gameType;
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    let bookmarkerId = query.bookmarkerId;
    const hasRight = await this.validateRightsService.hasRight({
      userId: member.id,
      rightsNeedCheck: [RIGHTS.AllowSearchFromBookmarker],
    });
    if (!hasRight) {
      bookmarkerId = member.bookmakerId;
    }
    const username = query.username;
    const isTestPlayer = query.isTestPlayer || false;
    const searchBy = query.searchBy;

    if (!searchBy || !bookmarkerId || !game || !gameType || !username) return {
      total: 0,
      nextPage: 0,
      prevPage: 0,
      lastPage: 0,
      currentPage: 0,
      ordersInfo: [],
    };

    let fromDate;
    let toDate;
    let total = 0;
    let dates: any = [];
    let lastPage = 0;
    let nextPage = 0;
    let prevPage = 0;
    let types = gameType.split(',');

    const bookmaker = await this.bookmakerService.getById(bookmarkerId);
    const bookmarkerName = bookmaker?.result?.name || '';

    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      return {
        total: 0,
        nextPage: 0,
        prevPage: 0,
        lastPage: 0,
        currentPage: 0,
        ordersInfo: [],
      };
    }

    const userId = user.id;
    const userCreateAt = user.createdAt;

    // if (searchBy === 'day') {
    //   dates = this.getNumberOfDay(query.fromDate, query.toDate);
    //   total = dates.length;
    //   lastPage = Math.ceil(total / limit);
    //   nextPage = page + 1 > lastPage ? null : page + 1;
    //   prevPage = page - 1 < 1 ? null : page - 1;
    //   dates = dates.slice(((page - 1) * limit), page * limit);

    //   if (!dates || dates.length === 0) return {
    //     total: 0,
    //     nextPage: 0,
    //     prevPage: 0,
    //     lastPage: 0,
    //     currentPage: 0,
    //     ordersInfo: [],
    //   };

    //   fromDate = dates[0];
    //   toDate = dates[dates.length - 1];
    //   console.log("toDate1: ", toDate)
    //   fromDate = startOfDay(new Date(fromDate));
    //   toDate = endOfDay(new Date(toDate));
    //   console.log("toDate2: ", toDate)
    //   fromDate = addHours(fromDate, 7);
    //   toDate = addHours(toDate, 7);
    //   console.log("toDate3: ", toDate)
    // }

    fromDate = startOfDay(new Date(query.fromDate));
    fromDate = addHours(fromDate, 7);
    toDate = endOfDay(new Date(query.toDate));
    toDate = addHours(toDate, 7);

    const lotterryOrders = await this.getLotteryOrdersByUser({
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    });
    const hiloOrders = await this.getHiloOrdersByUser({
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    });
    const kenoOrders = await this.getKenoOrdersByUser({
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    });
    const pokerOrders = await this.getPokerOrdersByUser({
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    });
    const finalResult = this.mergeOrdersByUser({
      lotterryOrders,
      hiloOrders,
      pokerOrders,
      kenoOrders,
      username,
      userCreateAt,
      bookmarkerName,
    });

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      currentPage: page,
      ordersInfo: finalResult,
    }
  }

  create(createStatisticDto: CreateStatisticDto) {
    return 'This action adds a new statistic';
  }

  findAll() {
    return `This action returns all statistic`;
  }

  findOne(id: number) {
    return `This action returns a #${id} statistic`;
  }

  update(id: number, updateStatisticDto: UpdateStatisticDto) {
    return `This action updates a #${id} statistic`;
  }

  remove(id: number) {
    return `This action removes a #${id} statistic`;
  }

  async getLotteryOrders(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      searchBy,
      month,
      dates,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      searchBy: string,
      month: string,
      dates: any,
      types: any,
    }) {
    let query = '';
    let result = [];

    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(created_at AS DATE) AS orderDate,
          SUM(paymentWin) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(paymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM orders AS entity
        WHERE entity.isTestPlayer = ${isTestPlayer} 
          AND entity.bookMakerId = '${bookmarkerId}' 
          AND entity.status = 'closed' 
          AND entity.created_at BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
      `;

      if (types.length > 0) {
        let queryType = 'AND (';
        let count = 0;
        for (const t of types) {
          if (count > 0) {
            queryType += ' OR ';
          }
          const seconds = t.trim().split('-')[1];
          const type = t.trim().split('-')[0];
          queryType += (`entity.type = '${type}' AND entity.seconds = '${seconds}'`);
          count++;
        }
        queryType += ')';
        query += queryType;
      }

      query += `
        GROUP BY CAST(created_at AS DATE)
      `;
      result = await this.orderRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
          SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            SUM(paymentWin) as paymentWin,
            SUM(entity.revenue) as totalBet,
            SUM(paymentWin) as bookmarkerProfit,
            COUNT(*) as count
          FROM orders AS entity
          WHERE entity.isTestPlayer = ${isTestPlayer}
            AND entity.bookMakerId = '${bookmarkerId}'
            AND entity.status = 'closed'
            AND DATE_FORMAT(entity.created_at, '%Y-%m') = '${searchDate}'
          GROUP BY month
        `;

        promises.push(this.orderRepository.query(query));
      }
      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    for (const item of result) {
      item.bookmarkerProfit = -(item.bookmarkerProfit);
    }

    return result;
  }

  async getLotteryOrdersByGame(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      searchBy,
      month,
      dates,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      searchBy: string,
      month: string,
      dates: any,
      types: any,
    }) {
    
    const hasSearchLottery = (types || []).some((i: string) => i.trim().indexOf("xs") > -1);
    if (!hasSearchLottery) return [];
    
    let query = '';
    let result = [];

    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(created_at AS DATE) AS orderDate,
          CONCAT(entity.type, '-', entity.seconds, 's') as typeGame,
          SUM(paymentWin) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(paymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM orders AS entity
        WHERE entity.isTestPlayer = ${isTestPlayer} 
          AND entity.bookMakerId = '${bookmarkerId}' 
          AND entity.status = 'closed' 
          AND entity.created_at BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
      `;

      if (types.length > 0) {
        let queryType = 'AND (';
        let count = 0;
        for (const t of types) {
          if (count > 0) {
            queryType += ' OR ';
          }
          const seconds = t.trim().split('-')[1];
          const type = t.trim().split('-')[0];
          queryType += (`entity.type = '${type}' AND entity.seconds = '${seconds}'`);
          count++;
        }
        queryType += ')';
        query += queryType;
      }

      query += `
        GROUP BY CAST(created_at AS DATE), typeGame
      `;
      result = await this.orderRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
          SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            CONCAT(entity.type, '-', entity.seconds, 's') as typeGame,
            SUM(paymentWin) as paymentWin,
            SUM(entity.revenue) as totalBet,
            SUM(paymentWin) as bookmarkerProfit,
            COUNT(*) as count
          FROM orders AS entity
          WHERE entity.isTestPlayer = ${isTestPlayer}
            AND entity.bookMakerId = '${bookmarkerId}'
            AND entity.status = 'closed'
            AND DATE_FORMAT(entity.created_at, '%Y-%m') = '${searchDate}'
          GROUP BY month, typeGame
        `;

        promises.push(this.orderRepository.query(query));
      }
      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    for (const item of result) {
      item.bookmarkerProfit = -(item.bookmarkerProfit);
    }

    return result;
  }

  async getHiloOrders(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      searchBy,
      month,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      searchBy: string,
      month: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchHilo = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.HILO);
    if (!hasSearchHilo) return [];

    const isGameOver = true;
    let query = '';
    let result = [];
    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(createdAt AS DATE) AS orderDate,
          SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_hilo AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE)
      `;
      result = await this.playHistoryHiloRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
            SELECT
              DATE_FORMAT(createdAt, '%Y-%m') AS month,
              SUM(totalPaymentWin) as paymentWin,
              SUM(entity.revenue) as totalBet,
              SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
              COUNT(*) as count
              FROM play_history_hilo AS entity
            WHERE entity.isUserFake = ${isTestPlayer}
              AND entity.bookmakerId = '${bookmarkerId}'
              AND entity.isGameOver = ${isGameOver}
              AND DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
            GROUP BY month
      `;

        promises.push(this.playHistoryHiloRepository.query(query));
      }

      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    return result;
  }

  async getHiloOrdersByGame(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      searchBy,
      month,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      searchBy: string,
      month: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchHilo = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.HILO);
    if (!hasSearchHilo) return [];

    const isGameOver = true;
    let query = '';
    let result = [];
    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(createdAt AS DATE) AS orderDate,
          'Hilo' as typeGame,
          SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_hilo AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE), typeGame
      `;
      result = await this.playHistoryHiloRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
            SELECT
              DATE_FORMAT(createdAt, '%Y-%m') AS month,
              'Hilo' as typeGame,
              SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
              SUM(entity.revenue) as totalBet,
              SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
              COUNT(*) as count
              FROM play_history_hilo AS entity
            WHERE entity.isUserFake = ${isTestPlayer}
              AND entity.bookmakerId = '${bookmarkerId}'
              AND entity.isGameOver = ${isGameOver}
              AND DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
            GROUP BY month, typeGame
      `;

        promises.push(this.playHistoryHiloRepository.query(query));
      }

      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    return result;
  }

  async getKenoOrders(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      month: string,
      searchBy: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchKeno = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.KENO);
    if (!hasSearchKeno) return [];

    const isGameOver = true;
    let query = '';
    let result = [];
    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(createdAt AS DATE) AS orderDate,
          SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_keno AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE)
      `;
      result = await this.playHistoryKenoRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
            SELECT
              DATE_FORMAT(createdAt, '%Y-%m') AS month,
              SUM(totalPaymentWin) as paymentWin,
              SUM(entity.revenue) as totalBet,
              SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
              COUNT(*) as count
            FROM play_history_keno AS entity
            WHERE entity.isUserFake = ${isTestPlayer}
              AND entity.bookmakerId = '${bookmarkerId}'
              AND entity.isGameOver = ${isGameOver}
              AND DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
            GROUP BY month
      `;

        promises.push(this.playHistoryKenoRepository.query(query));
      }

      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    return result;
  }

  async getKenoOrdersByGame(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      month: string,
      searchBy: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchKeno = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.KENO);
    if (!hasSearchKeno) return [];

    const isGameOver = true;
    let query = '';
    let result = [];
    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(createdAt AS DATE) AS orderDate,
          'Keno' as typeGame,
          SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_keno AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE), typeGame
      `;
      result = await this.playHistoryKenoRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
            SELECT
              DATE_FORMAT(createdAt, '%Y-%m') AS month,
              'Keno' as typeGame,
              SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
              SUM(entity.revenue) as totalBet,
              SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
              COUNT(*) as count
            FROM play_history_keno AS entity
            WHERE entity.isUserFake = ${isTestPlayer}
              AND entity.bookmakerId = '${bookmarkerId}'
              AND entity.isGameOver = ${isGameOver}
              AND DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
            GROUP BY month, typeGame
      `;

        promises.push(this.playHistoryKenoRepository.query(query));
      }

      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    return result;
  }

  async getPokerOrders(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      month: string,
      searchBy: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchPoker = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.VIDEO_POKER);
    if (!hasSearchPoker) return [];

    const isGameOver = true;
    let query = '';
    let result = [];
    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(createdAt AS DATE) AS orderDate,
          SUM(paymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(paymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_poker AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE)
    `;
      result = await this.playHistoryPokerRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
            SELECT
              DATE_FORMAT(createdAt, '%Y-%m') AS month,
              SUM(paymentWin) as paymentWin,
              SUM(entity.revenue) as totalBet,
              SUM(entity.revenue) - SUM(paymentWin) as bookmarkerProfit,
              COUNT(*) as count
            FROM play_history_poker AS entity
            WHERE entity.isUserFake = ${isTestPlayer}
              AND entity.bookmakerId = '${bookmarkerId}'
              AND entity.isGameOver = ${isGameOver}
              AND DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
            GROUP BY month
      `;

        promises.push(this.playHistoryPokerRepository.query(query));
      }

      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    return result;
  }

  async getPokerOrdersByGame(
    {
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      month,
      searchBy,
      dates,
      types,
    }: {
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      month: string,
      searchBy: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchPoker = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.VIDEO_POKER);
    if (!hasSearchPoker) return [];

    const isGameOver = true;
    let query = '';
    let result = [];
    if (searchBy === 'day') {
      query = `
        SELECT
          CAST(createdAt AS DATE) AS orderDate,
          'Poker' as typeGame,
          SUM(paymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(paymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_poker AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE), typeGame
    `;
      result = await this.playHistoryPokerRepository.query(query);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promises = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        query = `
            SELECT
              DATE_FORMAT(createdAt, '%Y-%m') AS month,
              'Poker' as typeGame,
              SUM(paymentWin) - SUM(entity.revenue) as paymentWin,
              SUM(entity.revenue) as totalBet,
              SUM(entity.revenue) - SUM(paymentWin) as bookmarkerProfit,
              COUNT(*) as count
            FROM play_history_poker AS entity
            WHERE entity.isUserFake = ${isTestPlayer}
              AND entity.bookmakerId = '${bookmarkerId}'
              AND entity.isGameOver = ${isGameOver}
              AND DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
            GROUP BY month, typeGame
      `;

        promises.push(this.playHistoryPokerRepository.query(query));
      }

      const tempResult = await Promise.all(promises);
      for (const item of tempResult) {
        if (item.length > 0) {
          result.push(item[0]);
        }
      }
    }

    return result;
  }

  getNumberOfDay(fromDate: Date, toDate: Date) {
    if (!fromDate || !toDate) return [];

    const dateArray = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= new Date(toDate)) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  }

  async numberOfUsers({
    searchBy,
    fromDate,
    toDate,
    month,
    isTestPlayer,
    bookmarkerId,
    game,
    gameType,
    dates,
  }: {
    searchBy: string,
    fromDate: Date,
    toDate: Date,
    month: string,
    isTestPlayer: boolean,
    bookmarkerId: boolean,
    game: string,
    gameType: string,
    dates: any,
  }) {
    let queryTotalUsers = '';
    let queryNewUsers = '';
    let totalUsers = [];
    let newUsers = [];

    if (searchBy === 'day') {
      queryTotalUsers = `
        SELECT
          CAST(createdAt AS DATE) AS date,
          COUNT(*) as count
        FROM users AS entity
        WHERE entity.updatedAt >= '${fromDate.toISOString()}'
          AND entity.updatedAt <= '${toDate.toISOString()}'
          AND entity.bookmakerId = '${bookmarkerId}'
      `;

      queryNewUsers = `
        SELECT
          CAST(createdAt AS DATE) AS date,
          COUNT(*) as count
        FROM users AS entity
        WHERE entity.createdAt >= '${fromDate.toISOString()}'
          AND entity.createdAt <= '${toDate.toISOString()}'
          AND entity.bookmakerId = '${bookmarkerId}'
      `;

      queryTotalUsers += `GROUP BY CAST(createdAt AS DATE)`;
      queryNewUsers += `GROUP BY CAST(createdAt AS DATE)`;
      totalUsers = await this.userRepository.query(queryTotalUsers);
      newUsers = await this.userRepository.query(queryNewUsers);
    } else if (searchBy === 'month') {
      const tempMonth = month.split(',');
      const promisesTotalUsers = [];
      const promisesNewUsers = [];
      for (let m of tempMonth) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const searchDate = `2024-${m}`;
        queryTotalUsers = `
            SELECT
              DATE_FORMAT(updatedAt, '%Y-%m') AS month,
              COUNT(*) as count
            FROM users AS entity
            WHERE DATE_FORMAT(entity.updatedAt, '%Y-%m') = '${searchDate}'
            AND entity.bookmakerId = '${bookmarkerId}'
            GROUP BY month
        `;

        queryNewUsers = `
          SELECT
            DATE_FORMAT(createdAt, '%Y-%m') AS month,
            COUNT(*) as count
          FROM users AS entity
          WHERE DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
          AND entity.bookmakerId = '${bookmarkerId}'
          GROUP BY month
        `;

        promisesTotalUsers.push(this.playHistoryHiloRepository.query(queryTotalUsers));
        promisesNewUsers.push(this.playHistoryHiloRepository.query(queryNewUsers));
      }

      const resultTotalUsers = await Promise.all(promisesTotalUsers);
      const resultNewUsers = await Promise.all(promisesNewUsers);
      for (const item of resultTotalUsers) {
        if (item.length > 0) {
          totalUsers.push(item[0]);
        }
      }

      for (const item of resultNewUsers) {
        if (item.length > 0) {
          newUsers.push(item[0]);
        }
      }
    }

    return {
      totalUsers,
      newUsers,
    };
  }

  mergeOrders({
    lotterryOrders,
    kenoOrders,
    pokerOrders,
    hiloOrders,
    dates,
    searchBy,
    months,
  }: any) {
    const result: any = [];
    if (searchBy === 'day') {
      for (let i = 0; i < dates.length; i++) {
        const date = DateTimeHelper.formatDate(new Date(dates[i]));

        const lotteryOrder = (lotterryOrders || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.orderDate));
          if (date === dateTemp) return item;
        });

        const kenoOrder = (kenoOrders || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.orderDate));
          if (date === dateTemp) return item;
        });

        const pokerOrder = (pokerOrders || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.orderDate));
          if (date === dateTemp) return item;
        });

        const hiloOrder = (hiloOrders || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.orderDate));
          if (date === dateTemp) return item;
        });

        result.push({
          bookmarkerProfit: (
            (Number(lotteryOrder?.bookmarkerProfit) || 0) + (Number(kenoOrder?.bookmarkerProfit) || 0) + (Number(pokerOrder?.bookmarkerProfit) || 0) + (Number(hiloOrder?.bookmarkerProfit) || 0)
          ),
          count: (
            (Number(lotteryOrder?.count) || 0) + (Number(kenoOrder?.count) || 0) + (Number(pokerOrder?.count) || 0) + (Number(hiloOrder?.count) || 0)
          ),
          orderDate: dates[i],
          paymentWin: (
            (Number(lotteryOrder?.paymentWin) || 0) + (Number(kenoOrder?.paymentWin) || 0) + (Number(pokerOrder?.paymentWin) || 0) + (Number(hiloOrder?.paymentWin) || 0)
          ),
          totalBet: (
            (Number(lotteryOrder?.totalBet) || 0) + (Number(kenoOrder?.totalBet) || 0) + (Number(pokerOrder?.totalBet) || 0) + (Number(hiloOrder?.totalBet) || 0)
          ),
        });
      }
    } else if (searchBy === 'month') {
      for (let m of months) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }

        const year = `2024-${m}`;

        const lotteryOrder = (lotterryOrders || []).find((item: any) => {
          if (year === item.month) return item;
        });

        const kenoOrder = (kenoOrders || []).find((item: any) => {
          if (year === item.month) return item;
        });

        const pokerOrder = (pokerOrders || []).find((item: any) => {
          if (year === item.month) return item;
        });

        const hiloOrder = (hiloOrders || []).find((item: any) => {
          if (year === item.month) return item;
        });

        result.push({
          bookmarkerProfit: (
            (Number(lotteryOrder?.bookmarkerProfit) || 0) + (Number(kenoOrder?.bookmarkerProfit) || 0) + (Number(pokerOrder?.bookmarkerProfit) || 0) + (Number(hiloOrder?.bookmarkerProfit) || 0)
          ),
          count: (
            (Number(lotteryOrder?.count) || 0) + (Number(kenoOrder?.count) || 0) + (Number(pokerOrder?.count) || 0) + (Number(hiloOrder?.count) || 0)
          ),
          month: year,
          paymentWin: (
            (Number(lotteryOrder?.paymentWin) || 0) + (Number(kenoOrder?.paymentWin) || 0) + (Number(pokerOrder?.paymentWin) || 0) + (Number(hiloOrder?.paymentWin) || 0)
          ),
          totalBet: (
            (Number(lotteryOrder?.totalBet) || 0) + (Number(kenoOrder?.totalBet) || 0) + (Number(pokerOrder?.totalBet) || 0) + (Number(hiloOrder?.totalBet) || 0)
          ),
        });
      }
    }

    return result;
  }

  mergeOrdersByGame({
    lotterryOrders,
    kenoOrders,
    pokerOrders,
    hiloOrders,
    dates,
    searchBy,
    months,
  }: any) {
    const result: any = lotterryOrders.concat(kenoOrders).concat(pokerOrders).concat(hiloOrders);

    return result;
  }

  fillArraySpace({
    searchBy,
    dates,
    ordersResult,
    months,
    totalUsers,
    newUsers,
    bookmarkerName,
  }: {
    searchBy: string,
    dates: any,
    ordersResult: any,
    months: any,
    totalUsers: any,
    newUsers: any,
    bookmarkerName: string,
  }) {
    const result = [];
    if (searchBy === 'day') {
      for (const date of dates) {
        const dateFormat = DateTimeHelper.formatDate(new Date(date));
        const lotteryOrder = (ordersResult || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.orderDate));
          if (dateFormat === dateTemp) return item;
        });

        const totalUsersByDay = (totalUsers || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.date));
          if (dateFormat === dateTemp) return item;
        });

        const newUserByDay = (newUsers || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.date));
          if (dateFormat === dateTemp) return item;
        });

        result.push({
          bookmarkerProfit: lotteryOrder?.bookmarkerProfit || 0,
          time: (new Date(date)).toLocaleDateString('en-GB'),
          count: lotteryOrder?.count || 0,
          paymentWin: lotteryOrder?.paymentWin || 0,
          totalBet: lotteryOrder?.totalBet || 0,
          totalUsers: totalUsersByDay?.count || 0,
          newUsers: newUserByDay?.count || 0,
          bookmarkerName,
        });
      }
    } else if (searchBy === 'month') {
      for (let m of months) {
        if (m.toString().length === 1) {
          m = `0${m}`;
        }
        const tempMonth = `2024-${m}`;
        const item = (ordersResult || []).find((i: any) => i.month === tempMonth);
        const totalUsersByMonth = (totalUsers || []).find((i: any) => i.month === tempMonth);
        const newUserByMonth = (newUsers || []).find((i: any) => i.month === tempMonth);
        result.push({
          bookmarkerProfit: item?.bookmarkerProfit || 0,
          count: item?.count || 0,
          time: (new Date(tempMonth)).toLocaleDateString('en-GB').substring(3),
          paymentWin: item?.paymentWin || 0,
          totalBet: item?.totalBet || 0,
          totalUsers: totalUsersByMonth?.count || 0,
          newUsers: newUserByMonth?.count || 0,
          bookmarkerName,
        });
      }
    }

    return result;
  }

  fillArraySpaceByGame({
    searchBy,
    dates,
    ordersResult,
    months,
    totalUsers,
    newUsers,
    bookmarkerName,
  }: {
    searchBy: string,
    dates: any,
    ordersResult: any,
    months: any,
    totalUsers: any,
    newUsers: any,
    bookmarkerName: string,
  }) {
    let result: any[] = [];
    if (searchBy === 'day') {
      ordersResult?.map((item: any) => {
        const dateFormat = DateTimeHelper.formatDate(new Date(item?.orderDate));
        const totalUsersByDay = (totalUsers || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.date));
          if (dateFormat === dateTemp) return item;
        });

        const newUserByDay = (newUsers || []).find((item: any) => {
          const dateTemp = DateTimeHelper.formatDate(new Date(item.date));
          if (dateFormat === dateTemp) return item;
        });
        result.push({
          typeGame: item?.typeGame,
          bookmarkerProfit: item?.bookmarkerProfit || 0,
          count: item?.count || 0,
          time: (new Date(item?.orderDate)).toLocaleDateString('en-GB'),
          timeSort: new Date(item?.orderDate).toLocaleDateString(),
          paymentWin: item?.paymentWin || 0,
          totalBet: item?.totalBet || 0,
          totalUsers: totalUsersByDay?.count || 0,
          newUsers: newUserByDay?.count || 0,
          bookmarkerName,
        });      
      });
      // for (const date of dates) {
      //   const dateFormat = DateTimeHelper.formatDate(new Date(date));
      //   const dataItem = (dataTmp || []).find((item: any) => {
      //     const dateTemp = DateTimeHelper.formatDate(new Date(item.time));
      //     if (dateFormat === dateTemp) return item;
      //   });

      //   result.push({
      //     typeGame: dataItem?.typeGame,
      //     bookmarkerProfit: dataItem?.bookmarkerProfit || 0,
      //     time: (new Date(date)).toLocaleDateString(),
      //     count: dataItem?.count || 0,
      //     paymentWin: dataItem?.paymentWin || 0,
      //     totalBet: dataItem?.totalBet || 0,
      //     totalUsers: dataItem?.count || 0,
      //     newUsers: dataItem?.count || 0,
      //     bookmarkerName,
      //   });
      // }
    } else if (searchBy === 'month') {
      ordersResult?.map((item: any) => {
        const totalUsersByMonth = (totalUsers || []).find((i: any) => i.month === item?.month);
        const newUserByMonth = (newUsers || []).find((i: any) => i.month === item?.month);
        result.push({
          typeGame: item?.typeGame,
          bookmarkerProfit: item?.bookmarkerProfit || 0,
          count: item?.count || 0,
          time: (new Date(item?.month)).toLocaleDateString('en-GB').substring(3),
          timeSort: item?.month,
          paymentWin: item?.paymentWin || 0,
          totalBet: item?.totalBet || 0,
          totalUsers: totalUsersByMonth?.count || 0,
          newUsers: newUserByMonth?.count || 0,
          bookmarkerName,
        });
      });
      // for (let m of months) {
      //   if (m.toString().length === 1) {
      //     m = `0${m}`;
      //   }
      //   const tempMonth = `2024-${m}`;
      //   const item = (dataTmp || []).find((i: any) => i.month === tempMonth);
      //   const totalUsersByMonth = (totalUsers || []).find((i: any) => i.month === tempMonth);
      //   const newUserByMonth = (newUsers || []).find((i: any) => i.month === tempMonth);
      //   result.push({
      //     bookmarkerProfit: item?.bookmarkerProfit || 0,
      //     count: item?.count || 0,
      //     time: tempMonth,
      //     paymentWin: item?.paymentWin || 0,
      //     totalBet: item?.totalBet || 0,
      //     totalUsers: totalUsersByMonth?.count || 0,
      //     newUsers: newUserByMonth?.count || 0,
      //     bookmarkerName,
      //   });
      // }
    }
    result = result.sort((a, b) => {
      const timeA = new Date(a.timeSort).getTime();
      const timeB = new Date(b.timeSort).getTime();
      return timeA - timeB;
    });

    return result;
  }

  // report by user 
  async getLotteryOrdersByUser(
    {
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    }: {
      userId: number,
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      dates: any,
      types: any,
    }) {
    
    const hasSearchLottery = (types || []).some((i: string) => i.trim().indexOf("xs") > -1);
    if (!hasSearchLottery) return [];
    
    let query = '';
    let result = [];

    query = `
        SELECT
          userId AS userId,
          CAST(created_at AS DATE) AS orderDate,
          SUM(paymentWin) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(paymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM orders AS entity
        WHERE entity.isTestPlayer = ${isTestPlayer} 
          AND entity.bookMakerId = '${bookmarkerId}'
          AND entity.userId = '${userId}' 
          AND entity.status = 'closed' 
          AND entity.created_at BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
      `;

    if (types.length > 0) {
      let queryType = 'AND (';
      let count = 0;
      for (const t of types) {
        if (count > 0) {
          queryType += ' OR ';
        }
        const seconds = t.trim().split('-')[1];
        const type = t.trim().split('-')[0];
        queryType += (`entity.type = '${type}' AND entity.seconds = '${seconds}'`);
        count++;
      }
      queryType += ')';
      query += queryType;
    }

    query += `
        GROUP BY CAST(created_at AS DATE), userId
      `;
    result = await this.orderRepository.query(query);

    for (const item of result) {
      item.bookmarkerProfit = -(item.bookmarkerProfit);
    }

    return result;
  }

  async getHiloOrdersByUser(
    {
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      types,
    }: {
      userId: number,
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchHilo = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.HILO);
    if (!hasSearchHilo) return [];

    const isGameOver = true;
    const query = `
        SELECT
          userId AS userId,
          CAST(createdAt AS DATE) AS orderDate,
          SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_hilo AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.userId = '${userId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE), userId
      `;
    const result = await this.playHistoryHiloRepository.query(query);

    return result;
  }

  async getKenoOrdersByUser(
    {
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    }: {
      userId: number,
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchKeno = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.KENO);
    if (!hasSearchKeno) return [];

    const isGameOver = true;
    const query = `
        SELECT
          userId AS userId,
          CAST(createdAt AS DATE) AS orderDate,
          SUM(totalPaymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(totalPaymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_keno AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.userId = '${userId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE), userId
      `;
    const result = await this.playHistoryKenoRepository.query(query);

    return result;
  }

  async getPokerOrdersByUser(
    {
      userId,
      isTestPlayer,
      bookmarkerId,
      fromDate,
      toDate,
      game,
      gameType,
      dates,
      types,
    }: {
      userId: number,
      isTestPlayer: boolean,
      bookmarkerId: number,
      fromDate: Date,
      toDate: Date,
      game: string,
      gameType: string,
      dates: any,
      types: any,
    }
  ) {
    const hasSearchPoker = (types || []).some((i: string) => i.trim() === CASINO_GAME_TYPES.VIDEO_POKER);
    if (!hasSearchPoker) return [];

    const isGameOver = true;
    const query = `
        SELECT
          userId AS userId,
          CAST(createdAt AS DATE) AS orderDate,
          SUM(paymentWin) - SUM(entity.revenue) as paymentWin,
          SUM(entity.revenue) as totalBet,
          SUM(entity.revenue) - SUM(paymentWin) as bookmarkerProfit,
          COUNT(*) as count
        FROM play_history_poker AS entity
        WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
          AND entity.userId = '${userId}'
          AND entity.isGameOver = ${isGameOver}
          AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' 
        GROUP BY CAST(createdAt AS DATE), userId
    `;
    const result = await this.playHistoryPokerRepository.query(query);

    return result;
  }

  mergeOrdersByUser({
    lotterryOrders,
    hiloOrders,
    pokerOrders,
    kenoOrders,
    username,
    userCreateAt,
    bookmarkerName,
  }: {
    lotterryOrders: any,
    hiloOrders: any,
    pokerOrders: any,
    kenoOrders: any,
    username: string,
    userCreateAt: any,
    bookmarkerName: string,
  }) {
    const dataMerge = lotterryOrders.concat(hiloOrders).concat(pokerOrders).concat(kenoOrders);
    const timeMap: any = {};

    dataMerge.forEach((item: any) => {
      if (!timeMap[item?.orderDate]) {
        timeMap[item?.orderDate] = {
          ...item,
          username: username,
          userCreateAt: (new Date(userCreateAt)).toLocaleDateString('en-GB'),
          bookmarkerName: bookmarkerName,
          time: (new Date(item?.orderDate)).toLocaleDateString('en-GB'),
          count: Number(item?.count),
          totalBet: Number(item?.totalBet),
          paymentWin: Number(item?.paymentWin),
          bookmarkerProfit: Number(item?.bookmarkerProfit),
        };
      } else {
        timeMap[item?.orderDate].count =
          Number(timeMap[item?.orderDate]?.count) + Number(item?.count);
        timeMap[item?.orderDate].totalBet =
          Number(timeMap[item?.orderDate]?.totalBet) + Number(item?.totalBet);
        timeMap[item?.orderDate].paymentWin =
          Number(timeMap[item?.orderDate]?.paymentWin) + Number(item?.paymentWin);
        timeMap[item?.orderDate].bookmarkerProfit =
          Number(timeMap[item?.orderDate]?.bookmarkerProfit) + Number(item?.bookmarkerProfit);
      }
    });

    let result : any[] = Object.values(timeMap);
    result = result.sort((a, b) => {
      const timeA = a.orderDate.getTime();
      const timeB = b.orderDate.getTime();
      return timeA - timeB;
    });
    return result;
  }

  async reportOrdersByUser(query: any, member: any) {
    const game = query.game;
    const gameType = query.gameType;
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    let bookmarkerId = query.bookmarkerId;
    const hasRight = await this.validateRightsService.hasRight({
      userId: member.id,
      rightsNeedCheck: [RIGHTS.AllowSearchFromBookmarker],
    });
    if (!hasRight) {
      bookmarkerId = member.bookmakerId;
    }
    const isTestPlayer = query.isTestPlayer || false;
    const status = query.status;
    const username = query.username;
    const bookmaker = await this.bookmakerService.getById(bookmarkerId);
    const bookmarkerName = bookmaker?.result?.name || '';
    let fromDate = query.fromDate;
    let toDate = query.toDate;
    fromDate = startOfDay(new Date(fromDate));
    toDate = endOfDay(new Date(toDate));
    fromDate = addHours(fromDate, 7);
    toDate = addHours(toDate, 7);
    const offset = (page - 1) * limit;
    let isGameOver: boolean;
    const user = await this.userService.getByUsername(username);

    if (username && !user) {
      return {
        orders: [],
        prevPage: 0,
        nextPage: 0,
        lastPage: 0,
        total: 0,
      };
    }

    if (status === 'closed') {
      isGameOver = true;
    } else if (status === 'pending') {
      isGameOver = false;
    }

    let userId;
    if (user) {
      userId = user.id;
    }

    let data: any =[];
    if (gameType === ALL_GAME_TYPES.HILO) {
      data = await this.reportByHiloOrders({
        gameType,
        limit,
        page,
        bookmarkerId,
        isTestPlayer,
        status,
        fromDate,
        toDate,
        isGameOver,
        userId,
        offset,
      });
    } else if (gameType === ALL_GAME_TYPES.KENO) {
      data = await this.reportByKenoOrders({
        gameType,
        limit,
        page,
        bookmarkerId,
        isTestPlayer,
        status,
        fromDate,
        toDate,
        isGameOver,
        userId,
        offset,
      });
    } else if (gameType === ALL_GAME_TYPES.VIDEO_POKER) {
      data = await this.reportByPokerOrders({
        gameType,
        limit,
        page,
        bookmarkerId,
        isTestPlayer,
        status,
        fromDate,
        toDate,
        isGameOver,
        userId,
        offset,
      });
    } else {
      data = await this.reportByLotteryOrders({
        gameType,
        limit,
        page,
        bookmarkerId,
        isTestPlayer,
        status,
        fromDate,
        toDate,
        offset,
        userId,
      });
    }

    for (const item of (data?.orders || [])) {
      item.bookmarkerName = bookmarkerName;
      item.username = username || '';
      item.gameType = gameType;
      item.openTime = (new Date(item.openTime))
      item.closeTime = (new Date(item.closeTime))

      if (
        gameType === CASINO_GAME_TYPES.HILO
        || gameType === CASINO_GAME_TYPES.KENO
        || gameType === CASINO_GAME_TYPES.MINES
        || gameType === CASINO_GAME_TYPES.VIDEO_POKER
      ) {
        item.game = GAMES.Casino;
        if (item.status === 1) {
          item.status = 'closed';
        } else {
          item.status = 'pending';
        }
      } else {
        const seconds = gameType.split('-')[1];
        if (seconds == 1) {
          item.openTime = item.createdAt;
          item.closeTime = item.updatedAt;
        }

        item.profit = -(item.totalPaymentWin);
        item.game = GAMES.XoSo;
      }
    }

    return data;
  }


  async reportByLotteryOrders({
    gameType,
    limit,
    bookmarkerId,
    isTestPlayer,
    status,
    fromDate,
    toDate,
    offset,
    page,
    userId,
  }: any) {
    const seconds = gameType.trim().split('-')[1];
    const type = gameType.trim().split('-')[0];
    let queryCount = `
      SELECT COUNT(*) as count
      FROM orders AS entity
      WHERE entity.isTestPlayer = ${isTestPlayer}
        AND entity.bookMakerId = '${bookmarkerId}'
    `;

    if (status) {
      queryCount += `
        AND entity.status = '${status}'
      `
    }
    if (userId) {
      queryCount += `
        AND entity.userId = '${userId}'
      `;
    }
    queryCount += `
      AND entity.created_at BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'
      AND entity.type = '${type}'
      AND entity.seconds = '${seconds}'
    `;
    const resultCount = await this.orderRepository.query(queryCount);

    let query = `
      SELECT id as id, openTime as openTime, closeTime as closeTime, paymentWin as totalPaymentWin, revenue as revenue, status as status, created_at as createdAt, updated_at as updatedAt
      FROM orders AS entity
      WHERE entity.isTestPlayer = ${isTestPlayer}
        AND entity.bookMakerId = '${bookmarkerId}'
    `;

    if (status) {
      query += `
        AND entity.status = '${status}'
      `;
    }
    if (userId) {
      query += `
        AND entity.userId = '${userId}'
      `;
    }
    query += `
      AND entity.created_at BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'
      AND entity.type = '${type}'
      AND entity.seconds = '${seconds}'
      ORDER BY id asc
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = Number(resultCount[0].count);
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    const orders = await this.orderRepository.query(query);

    return {
      orders,
      prevPage,
      nextPage,
      lastPage,
      total,
    };
  }

  async reportByKenoOrders({
    limit,
    page,
    bookmarkerId,
    isTestPlayer,
    fromDate,
    toDate,
    userId,
    offset,
    isGameOver,
  }: any) {
    let queryCount = `
      SELECT COUNT(*) as count
      FROM play_history_keno AS entity
      WHERE entity.isUserFake = ${isTestPlayer}
        AND entity.bookmakerId = '${bookmarkerId}'
    `;

    if (isGameOver === false || isGameOver === true) {
      queryCount += `
        AND entity.isGameOver = ${isGameOver}
      `;
    }

    queryCount += `
      AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'
    `;

    if (userId) {
      queryCount += `
      AND entity.userId = '${userId}'
    `;
    }
    const resultCount = await this.playHistoryKenoRepository.query(queryCount);

    let query = `
      SELECT id as id, createdAt as openTime,updatedAt as closeTime, totalPaymentWin as totalPaymentWin, revenue as revenue, isGameOver as status, (revenue - totalPaymentWin) as profit
      FROM play_history_keno AS entity
      WHERE entity.isUserFake = ${isTestPlayer}
        AND entity.bookmakerId = '${bookmarkerId}'
    `;

    if (isGameOver === false || isGameOver === true) {
      query += `
        AND entity.isGameOver = ${isGameOver}
      `;
    }

    query += `
      AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'
    `;

    if (userId) {
      query += `
        AND entity.userId = '${userId}'
      `;
    }
    query += `
      ORDER BY id asc
      LIMIT ${limit} OFFSET ${offset}
    `;

    const orders = await this.playHistoryKenoRepository.query(query);
    const total = Number(resultCount[0].count);
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      orders,
      prevPage,
      nextPage,
      lastPage,
      total,
    };
  }

  async reportByHiloOrders({
    limit,
    page,
    bookmarkerId,
    isTestPlayer,
    fromDate,
    toDate,
    userId,
    offset,
    isGameOver,
  }: any) {
    let queryCount = `
      SELECT COUNT(*) as count
      FROM play_history_hilo AS entity
      WHERE entity.isUserFake = ${isTestPlayer}
        AND entity.bookmakerId = '${bookmarkerId}'
    `;

    if (isGameOver === false || isGameOver === true) {
      queryCount += `
        AND entity.isGameOver = ${isGameOver}
      `;
    }

    queryCount += `AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'`;

    if (userId) {
      queryCount += `
        AND entity.userId = '${userId}'
      `;
    }
    const resultCount = await this.orderRepository.query(queryCount);

    let query = `
      SELECT id as id, createdAt as openTime,updatedAt as closeTime, totalPaymentWin as totalPaymentWin, revenue as revenue, isGameOver as status, (revenue - totalPaymentWin) as profit
      FROM play_history_hilo AS entity
      WHERE entity.isUserFake = ${isTestPlayer}
        AND entity.bookmakerId = '${bookmarkerId}'
    `;

    if (isGameOver === false || isGameOver === true) {
      query += `
        AND entity.isGameOver = ${isGameOver}
      `;
    }

    query += `AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}' `;

    if (userId) {
      query += `
        AND entity.userId = '${userId}'
      `;
    }
    query += `
      ORDER BY id asc
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = Number(resultCount[0].count);
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    const orders = await this.orderRepository.query(query);

    return {
      orders,
      prevPage,
      nextPage,
      lastPage,
      total,
    };
  }

  async reportByPokerOrders({
    limit,
    page,
    bookmarkerId,
    isTestPlayer,
    fromDate,
    toDate,
    userId,
    offset,
    isGameOver,
  }: any) {
    let queryCount = `
      SELECT COUNT(*) as count
      FROM play_history_poker AS entity
      WHERE entity.isUserFake = ${isTestPlayer}
        AND entity.bookmakerId = '${bookmarkerId}'
    `;

    if (isGameOver === false || isGameOver === true) {
      queryCount += `
        AND entity.isGameOver = ${isGameOver}
      `;
    }
    queryCount += `
      AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'
    `;

    if (userId) {
      queryCount += `
        AND entity.userId = '${userId}'
      `;
    }
    const resultCount = await this.orderRepository.query(queryCount);

    let query = `
      SELECT id as id, createdAt as openTime,updatedAt as closeTime, paymentWin as totalPaymentWin, revenue as revenue, isGameOver as status, (revenue - paymentWin) as profit
      FROM play_history_poker AS entity
      WHERE entity.isUserFake = ${isTestPlayer}
          AND entity.bookmakerId = '${bookmarkerId}'
    `;

    if (isGameOver === false || isGameOver === true) {
      query += `
        AND entity.isGameOver = ${isGameOver}
      `;
    }

    query += `
      AND entity.createdAt BETWEEN '${fromDate.toISOString()}' AND '${toDate.toISOString()}'
    `;

    if (userId) {
      query += `
        AND entity.userId = '${userId}'
      `;
    }
    query += `
      ORDER BY id asc
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = Number(resultCount[0].count);
    const lastPage = Math.ceil(total / limit);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    const orders = await this.orderRepository.query(query);

    return {
      orders,
      prevPage,
      nextPage,
      lastPage,
      total,
    };
  }
}
