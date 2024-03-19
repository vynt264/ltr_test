import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { User } from "../user/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, LessThanOrEqual, Like, MoreThan, Repository } from "typeorm";
import { Order } from "../orders/entities/order.entity";
import { PaginationQueryDto } from "src/common/common.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { MESSAGE, STATUSCODE, TypeLottery } from "src/system/constants";
import { UserService } from "../user/user.service";
import { ErrorResponse, SuccessResponse } from "src/system/BaseResponse";
import { Logger } from "winston";
import { LotteryAwardService } from "../lottery.award/lottery.award.service";

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
        const lotteryAward = await this.lotteryAwardService.getLotteryAwardByTurn(order.turnIndex, `${order.type}${order.seconds}s`);
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

      const listDataReal = await this.userRepository
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
        .getRawMany();

      const response: any = [];
      if (listDataReal.length > 0) {
        listDataReal.map((item) => {
          const res = {
            currentBalance: item.balance,
            bookmakerName: item.bookmakerName,
            username: item?.username,
            nickname: item?.nickname,
            countBet: item?.count,
            totalBet: item?.totalBet,
            totalWin: item?.totalPaymentWin,
            totalLoss: -1 * item?.totalPaymentWin
          }
          response.push(res);
        })
      }

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
}