import { Injectable } from '@nestjs/common';
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
import { CASINO_GAME_TYPES } from 'src/system/constants/game';

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
  ) { }

  async reportByBookmarker(query: any) {
    const month = query.month;
    const game = query.game;
    const gameType = query.gameType;
    const limit = Number(query.limit) || 10;
    const page = Number(query.page) || 1;
    const bookmarkerId = query.bookmarkerId;
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
      days: dates,
    });
    finalResult = this.fillArraySpace({
      searchBy,
      dates,
      ordersResult: finalResult,
      months: month.split(','),
      totalUsers,
      newUsers,
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
          const seconds = OrderHelper.getPlayingTimeByType(t);
          const type = OrderHelper.getTypeLottery(t);
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
          SUM(totalPaymentWin) as paymentWin,
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
          SUM(totalPaymentWin) as paymentWin,
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
          SUM(paymentWin) as paymentWin,
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
      `;

      queryNewUsers = `
        SELECT
          CAST(createdAt AS DATE) AS date,
          COUNT(*) as count
        FROM users AS entity
        WHERE entity.createdAt >= '${fromDate.toISOString()}'
          AND entity.createdAt <= '${toDate.toISOString()}'
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
            GROUP BY month
        `;

        queryNewUsers = `
          SELECT
            DATE_FORMAT(createdAt, '%Y-%m') AS month,
            COUNT(*) as count
          FROM users AS entity
          WHERE DATE_FORMAT(entity.createdAt, '%Y-%m') = '${searchDate}'
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
    days,
  }: any) {
    const result: any = [];
    for (let i = 0; i < days.length; i++) {
      const date = DateTimeHelper.formatDate(new Date(days[i]));

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
        orderDate: days[i],
        paymentWin: (
          (Number(lotteryOrder?.paymentWin) || 0) + (Number(kenoOrder?.paymentWin) || 0) + (Number(pokerOrder?.paymentWin) || 0) + (Number(hiloOrder?.paymentWin) || 0)
        ),
        totalBet: (
          (Number(lotteryOrder?.totalBet) || 0) + (Number(kenoOrder?.totalBet) || 0) + (Number(pokerOrder?.totalBet) || 0) + (Number(hiloOrder?.totalBet) || 0)
        ),
      });
    }

    return result;
  }

  fillArraySpace({
    searchBy,
    dates,
    ordersResult,
    months,
    totalUsers,
    newUsers,
  }: {
    searchBy: string,
    dates: any,
    ordersResult: any,
    months: any,
    totalUsers: any,
    newUsers: any,
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
          time: (new Date(date)).toLocaleDateString(),
          count: lotteryOrder?.count || 0,
          paymentWin: lotteryOrder?.paymentWin || 0,
          totalBet: lotteryOrder?.totalBet || 0,
          totalUsers: totalUsersByDay?.count || 0,
          newUsers: newUserByDay?.count || 0,
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
          time: tempMonth,
          paymentWin: item?.paymentWin || 0,
          totalBet: item?.totalBet || 0,
          totalUsers: totalUsersByMonth?.count || 0,
          newUsers: newUserByMonth?.count || 0,
        });
      }
    }

    return result;
  }
}
