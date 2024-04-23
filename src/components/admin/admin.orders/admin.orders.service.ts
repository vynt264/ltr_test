import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { User } from "../../user/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, LessThanOrEqual, Like, MoreThan, Repository } from "typeorm";
import { Order } from "../../orders/entities/order.entity";
import { PaginationQueryDto } from "src/common/common.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { MESSAGE, STATUSCODE, TypeLottery } from "src/system/constants";
import { UserService } from "../../user/user.service";
import { ErrorResponse, SuccessResponse } from "src/system/BaseResponse";
import { Logger } from "winston";
import { LotteryAwardService } from "../../lottery.award/lottery.award.service";

@Injectable()
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UserService,
    @Inject("winston")
    private readonly logger: Logger,
    private lotteryAwardService: LotteryAwardService,
  ) { }

  async findAll(paginationDto: PaginationQueryDto) {
    const { take: perPage, skip: page } = paginationDto;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      const listDataReal = await this.orderRepository.findAndCount({
        relations: ["user", "user.bookmaker", "winningNumber", "user.userInfo"],
        select: {
          user: {
            id: true,
            username: true,
            bookmaker: {
              id: true,
              name: true
            },
            userInfo: {
              nickname: true,
            },
          },
          winningNumber: {
            id: true,
            winningNumbers: true,
          }
        },
        where: this.handleQuery(object),
        take: +perPage,
        skip,
        order: {
          createdAt: "DESC"
        }
      }) as any;

      for (const order of (listDataReal?.[0] || [])) {
        const lotteryAward = await this.lotteryAwardService.getLotteryAwardByTurn(order.turnIndex, `${order.type}${order.seconds}s`, order.isTestPlayer);
        order.awardDetail = lotteryAward?.awardDetail;
        order.bonusPrice = lotteryAward?.bonusPrice;
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listDataReal,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminOrdersService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  handleQuery(object: any) {
    const data: any = {};
    if (!object) {
      return [];
    }

    for (const key in object) {
      if (key === "bookmakerId") {
        data.user = {
          ...data.user,
          bookmaker: { id: object.bookmakerId },
        };
      }

      if (key === "username") {
        data.user = {
          ...data.user,
          username: Like(`%${object.username}%`),
        };
      }

      if (key === "nickname") {
        data.user = {
          ...data.user,
          userInfo: { nickname: Like(`%${object.nickname}%`) },
        };
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }

      if (key === "status") {
        data.status = object.status
      }

      if (key === "type") {
        data.type = object.type;
      }

      if (key === "seconds") {
        data.seconds = object.seconds;
      }

      if (key === "numericalOrder") {
        data.numericalOrder = object.numericalOrder;
      }

      if (key === "turnIndex") {
        data.turnIndex = object.turnIndex;
      }

      if (key === "isTestPlayer") {
        if (object?.isTestPlayer === 'false') {
          data.isTestPlayer = false;
        }
        if (object?.isTestPlayer === 'true') {
          data.isTestPlayer = true;
        }
      }
    }
    return [data];
  }

  async reportAll(bookmakerId: number, type: string) {
    try {
      let condition = "user.usernameReal = '' AND entity.status = 'closed'";
      const conditionParams: any = {}
      if (bookmakerId > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = bookmakerId;
      }
      const addSelectDateFm =
        type == "day" ?
          `DATE_FORMAT(entity.created_at, "%Y-%m-%d") as timeFilter` :
          type == "month" ?
            `DATE_FORMAT(entity.created_at, "%Y-%m") as timeFilter` :
            `DATE_FORMAT(entity.created_at, "%Y") as timeFilter`;

      const listDataReal = await this.orderRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect("users", "user", "entity.userId = user.id")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "user.bookmakerId = bookmaker.id"
        )
        .select("bookmaker.name as bookmakerName")
        .addSelect(addSelectDateFm)
        .addSelect("COUNT(entity.id) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .addSelect("SUM(entity.paymentWin) as totalPaymentWin")
        .where(condition, conditionParams)
        .groupBy("bookmakerName, timeFilter")
        .orderBy("timeFilter", "DESC")
        .getRawMany();

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listDataReal,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminOrdersService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getReportOrders({
    bookmarkerId,
    username,
    fromDate,
    toDate,
    type,
    skip: page,
    take: perPage,
    isTestPlayer,
    turnIndex,
  }: any) {
    if (!fromDate && !toDate) return {};

    let isTest = false;
    if (isTestPlayer === 'true') {
      isTest = true;
    }

    let fromD;
    let toD;
    if (fromDate && toDate) {
      fromD = startOfDay(new Date(fromDate));
      toD = endOfDay(new Date(toDate));
    } else if (fromDate) {
      fromD = startOfDay(new Date(fromDate));
      toD = endOfDay(new Date(fromDate));
    } else if (toDate) {
      fromD = startOfDay(new Date());
      toD = endOfDay(new Date(fromDate));
    }

    fromD = addHours(fromD, 7);
    toD = addHours(toD, 7);

    // get user by username
    let user;
    let userId;
    if (username) {
      user = await this.userService.getByUsername(username);
      userId = user.id;
    }

    let seconds = 0;
    let gameType = '';
    if (type) {
      seconds = type.split('-')[1];
      gameType = type.split('-')[0];
    }

    // count orders by type
    let queryOrders = `
        SELECT type, seconds, user.name,
          SUM(paymentWin) as paymentWin,
          SUM(revenue) as revenue,
          COUNT(*) as count
        FROM orders
        INNER JOIN users as user ON orders.userId = user.id
        WHERE orders.created_at >= '${fromD.toISOString()}' 
          AND orders.created_at <= '${toD.toISOString()}' 
          AND orders.status = 'closed'
          AND orders.bookMakerId = '${bookmarkerId}'
          AND orders.isTestPlayer = ${isTest}
      `;
    if (gameType) {
      queryOrders += `AND orders.type = '${gameType}'`
    }

    if (seconds) {
      queryOrders += `AND orders.seconds = '${seconds}'`
    }

    if (userId) {
      queryOrders += `AND orders.userId = '${userId}'`
    }

    if (turnIndex) {
      queryOrders += `AND orders.turnIndex = '${turnIndex}'`
    }

    queryOrders += `
      GROUP BY type, seconds, user.name
    `;

    if (!page) {
      page = 1;
    }
    page = Number(page);

    if (!perPage) {
      perPage = 10;
    }
    perPage = Number(perPage);

    const allOrders = await this.orderRepository.query(queryOrders);
    const total = allOrders.length;
    const lastPage = Math.ceil(total / (perPage || 10));
    const nextPage = (page) + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;
    const offset = (page - 1) * (perPage || 10);

    queryOrders += `
      LIMIT ${perPage} OFFSET ${offset}
    `;

    const orders = await this.orderRepository.query(queryOrders);

    return {
      total,
      nextPage,
      prevPage,
      lastPage,
      orders,
      currentPage: page,
    }
  }

  async reportChart(bookmakerId: number) {
    try {
      let condition = "user.usernameReal = '' AND entity.status = 'closed'";
      const conditionParams: any = {}
      if (bookmakerId > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = bookmakerId;
      }

      const responseUsers = await this.userService.getOneByBookmaker(
        bookmakerId
      );

      const dataOrders = await this.orderRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect("users", "user", "entity.userId = user.id")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "user.bookmakerId = bookmaker.id"
        )
        .select("bookmaker.name as bookmakerName")
        .addSelect("COUNT(entity.id) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .addSelect("SUM(entity.paymentWin) as totalPaymentWin")
        .where(condition, conditionParams)
        .groupBy("bookmakerName")
        .getRawMany();

      const dataLottery = await this.orderRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect("users", "user", "entity.userId = user.id")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "user.bookmakerId = bookmaker.id"
        )
        .select("entity.type as typeGame")
        .addSelect("entity.seconds as secondsGame")
        .addSelect("COUNT(entity.id) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .addSelect("SUM(entity.paymentWin) as totalPaymentWin")
        .where(condition, conditionParams)
        .groupBy("typeGame, secondsGame")
        .getRawMany();

      const dataResult = responseUsers.map((itemU: any) => {
        const matchingItemB = dataOrders.find(
          (itemO) => itemO.bookmakerName === itemU.bookmakerName
        );
        if (matchingItemB) {
          return {
            bookmakerName: itemU.bookmakerName,
            countUser: itemU.count,
            countOrder: matchingItemB.count,
            totalBet: matchingItemB.totalBet,
            totalPaymentWin: matchingItemB.totalPaymentWin,
          };
        }
        return itemU;
      });

      const result = {
        dataGenaral: dataResult,
        dataGame: dataLottery
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        result,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminOrdersService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async reportChartByGame(bookmakerId: number) {
    try {
      let condition = "user.usernameReal = ''";
      const conditionParams: any = {}
      if (bookmakerId > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = bookmakerId;
      }

      const dataLottery = await this.orderRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect("users", "user", "entity.userId = user.id")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "user.bookmakerId = bookmaker.id"
        )
        .select("bookmaker.name as bookmakerName")
        .addSelect("entity.type as typeGame")
        .addSelect("entity.seconds as secondsGame")
        .addSelect("COUNT(entity.id) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .addSelect("SUM(entity.paymentWin) as totalPaymentWin")
        .where(condition, conditionParams)
        .groupBy("bookmakerName, typeGame, secondsGame")
        .getRawMany();

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        dataLottery,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminOrdersService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async reportDetailByTime(bookmakerId: number, type: string) {
    try {
      let condition = "user.usernameReal = '' AND entity.status = 'closed' AND entity.created_at > DATE_SUB(now(), INTERVAL 6 MONTH)";
      const conditionParams: any = {}
      if (bookmakerId > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = bookmakerId;
      }
      const addSelectDateFm =
        type == "day" ?
          `DATE_FORMAT(entity.created_at, "%Y-%m-%d") as timeFilter` :
          `DATE_FORMAT(entity.created_at, "%Y-%m") as timeFilter`;

      const listDataReal = await this.orderRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect("users", "user", "entity.userId = user.id")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "user.bookmakerId = bookmaker.id"
        )
        .select("bookmaker.name as bookmakerName")
        .addSelect(addSelectDateFm)
        .addSelect("COUNT(entity.id) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .addSelect("SUM(entity.paymentWin) as totalPaymentWin")
        .where(condition, conditionParams)
        .groupBy("bookmakerName, timeFilter")
        .orderBy("timeFilter", "ASC")
        .getRawMany();

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listDataReal,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminOrdersService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getUserInfo(bookmakerId: number, username: string, nickname: string) {
    try {
      let condition = "entity.usernameReal = ''";
      const conditionParams: any = {}
      if (bookmakerId > 0) {
        condition = condition.concat(`AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = bookmakerId;
      }
      if (username) {
        condition = condition.concat(` AND entity.username LIKE :usernameFind`);
        conditionParams.usernameFind = `%${username}%`;
      }
      if (nickname) {
        condition = condition.concat(` AND userInfo.nickname LIKE :nicknameFind`);
        conditionParams.nicknameFind = `%${nickname}%`;
      }

      const [lottery, hilo, poker] = await Promise.all([
        this.userRepository
          .createQueryBuilder("entity")
          .leftJoinAndSelect("orders", "orders", "entity.id = orders.userId")
          .leftJoinAndSelect(
            "bookmaker",
            "bookmaker",
            "entity.bookmakerId = bookmaker.id"
          )
          .leftJoinAndSelect(
            "user_info",
            "userInfo",
            "entity.id = userInfo.userId"
          )
          .leftJoinAndSelect("wallet", "wallet", "entity.id = wallet.userId")
          .select("bookmaker.name as bookmakerName")
          .addSelect("entity.username as username")
          .addSelect("userInfo.nickname as nickname")
          .addSelect("wallet.balance as balance")
          .addSelect("COUNT(orders.id) as count")
          .addSelect("SUM(orders.revenue) as totalBet")
          .addSelect("SUM(orders.paymentWin) as totalPaymentWin")
          .where(condition, conditionParams)
          .groupBy("bookmakerName, username, nickname, balance")
          .orderBy("username", "ASC")
          .getRawMany(),
        this.userRepository
          .createQueryBuilder("entity")
          .leftJoinAndSelect(
            "bookmaker",
            "bookmaker",
            "entity.bookmakerId = bookmaker.id"
          )
          .leftJoinAndSelect(
            "play_history_hilo",
            "historyHilo",
            "entity.id = historyHilo.userId"
          )
          .leftJoinAndSelect(
            "user_info",
            "userInfo",
            "entity.id = userInfo.userId"
          )
          .leftJoinAndSelect("wallet", "wallet", "entity.id = wallet.userId")
          .select("bookmaker.name as bookmakerName")
          .addSelect("entity.username as username")
          .addSelect("userInfo.nickname as nickname")
          .addSelect("wallet.balance as balance")
          .addSelect("COUNT(historyHilo.id) as count")
          .addSelect("SUM(historyHilo.revenue) as totalBet")
          .addSelect("SUM(historyHilo.totalPaymentWin - historyHilo.revenue) as totalPaymentWin")
          .where(condition, conditionParams)
          .groupBy("bookmakerName, username, nickname, balance")
          .orderBy("username", "ASC")
          .getRawMany(),
        this.userRepository
          .createQueryBuilder("entity")
          .leftJoinAndSelect(
            "bookmaker",
            "bookmaker",
            "entity.bookmakerId = bookmaker.id"
          )
          .leftJoinAndSelect(
            "play_history_poker",
            "historyPoker",
            "entity.id = historyPoker.userId"
          )
          .leftJoinAndSelect(
            "user_info",
            "userInfo",
            "entity.id = userInfo.userId"
          )
          .leftJoinAndSelect("wallet", "wallet", "entity.id = wallet.userId")
          .select("bookmaker.name as bookmakerName")
          .addSelect("entity.username as username")
          .addSelect("userInfo.nickname as nickname")
          .addSelect("wallet.balance as balance")
          .addSelect("COUNT(historyPoker.id) as count")
          .addSelect("SUM(historyPoker.revenue) as totalBet")
          .addSelect("SUM(historyPoker.paymentWin - historyPoker.revenue) as totalPaymentWin")
          .where(condition, conditionParams)
          .groupBy("bookmakerName, username, nickname, balance")
          .orderBy("username", "ASC")
          .getRawMany(),
      ])

      // const listDataReal = await this.userRepository
      //   .createQueryBuilder("entity")
      //   .leftJoinAndSelect("orders", "orders", "entity.id = orders.userId")
      //   .leftJoinAndSelect(
      //     "bookmaker",
      //     "bookmaker",
      //     "entity.bookmakerId = bookmaker.id"
      //   )
      //   .leftJoinAndSelect(
      //     "play_history_hilo",
      //     "historyHilo",
      //     "entity.id = historyHilo.userId"
      //   )
      //   .leftJoinAndSelect(
      //     "play_history_poker",
      //     "historyPoker",
      //     "entity.id = historyPoker.userId"
      //   )
      //   .leftJoinAndSelect(
      //     "user_info",
      //     "userInfo",
      //     "entity.id = userInfo.userId"
      //   )
      //   .leftJoinAndSelect("wallet", "wallet", "entity.id = wallet.userId")
      //   .select("bookmaker.name as bookmakerName")
      //   .addSelect("entity.username as username")
      //   .addSelect("userInfo.nickname as nickname")
      //   .addSelect("wallet.balance as balance")
      //   .addSelect("COUNT(orders.id) as countLottery")
      //   .addSelect("SUM(orders.revenue) as totalBetLottery")
      //   .addSelect("SUM(orders.paymentWin) as totalPaymentWinLottery")
      //   .addSelect("COUNT(historyHilo.id) as countHilo")
      //   .addSelect("SUM(historyHilo.revenue) as totalBetHilo")
      //   .addSelect("SUM(historyHilo.totalPaymentWin) as totalPaymentWinHilo")
      //   .addSelect("COUNT(historyPoker.id) as countPoker")
      //   .addSelect("SUM(historyPoker.revenue) as totalBetPoker")
      //   .addSelect("SUM(historyPoker.paymentWin) as totalPaymentWinPoker")
      //   .where(condition, conditionParams)
      //   .groupBy("bookmakerName, username, nickname, balance")
      //   .orderBy("username", "ASC")
      //   .getRawMany();

      // console.log(lottery);
      // console.log(hilo);
      // console.log(poker);
      // if (listDataReal.length > 0) {
      //   listDataReal.map((item) => {
      //     const totalCount =
      //       Number(item?.countLottery) +
      //       Number(item?.countHilo) +
      //       Number(item?.countPoker);
      //     const totalBet =
      //       Number(item?.totalBetLottery) +
      //       Number(item?.totalBetHilo) +
      //       Number(item?.totalBetPoker);
      //     const totalWin =
      //       Number(item?.totalPaymentWinLottery) +
      //       (Number(item?.totalPaymentWinHilo) - Number(item?.totalBetHilo)) +
      //       (Number(item?.totalPaymentWinPoker) - Number(item?.totalBetPoker));
      //     const totalLoss = -1 * totalWin;
      //     const res = {
      //       currentBalance: item.balance,
      //       bookmakerName: item.bookmakerName,
      //       username: item?.username,
      //       nickname: item?.nickname,
      //       countBet: totalCount,
      //       totalBet: totalBet,
      //       totalWin: totalWin,
      //       totalLoss: totalLoss,
      //     }
      //     response.push(res);
      //   })
      // }

      const dataMerge = lottery.concat(hilo).concat(poker);
      const response: any = this.groupArray(dataMerge);
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminOrdersService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  groupArray(array: any) {
    const result: any = [];

    array.forEach((item: any) => {
      const existingItem = result.find(
        (i: any) => i.bookmakerName === item.bookmakerName && i.username === item.username
      );

      if (existingItem) {
        existingItem.count = Number(existingItem.count) + Number(item.count);
        existingItem.totalBet = Number(existingItem.totalBet) + Number(item.totalBet);
        existingItem.totalPaymentWin = Number(existingItem.totalPaymentWin) + Number(item.totalPaymentWin);
      } else {
        result.push({ ...item });
      }
    });
    return result;
  }
}