import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { User } from "../user/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "../orders/entities/order.entity";
import { PlayHistoryHilo } from "../admin.hilo/entities/play.history.hilo.entity";
import { PlayHistoryPoker } from "../admin.poker/entities/play.history.poker.entity";
import { PaginationQueryDto } from "src/common/common.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { MESSAGE, STATUSCODE, TypeLottery } from "src/system/constants";
import { ErrorResponse, SuccessResponse } from "src/system/BaseResponse";
import { Logger } from "winston";
import { Helper } from "src/common/helper";
import * as moment from "moment";

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(PlayHistoryHilo)
    private playHistoryHiloRepository: Repository<PlayHistoryHilo>,
    @InjectRepository(PlayHistoryPoker)
    private playHistoryPokerRepository: Repository<PlayHistoryPoker>,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async dataChartUser(paginationDto: PaginationQueryDto) {
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      let condition = "entity.usernameReal = '' AND entity.role = 'member'";
      const conditionParams: any = {}
      if (object?.bookmaker > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = object?.bookmaker;
      }
      if (object?.startDate) {
        const startDate = new Date(object.startDate);
        condition = condition.concat(` AND (entity.updatedAt >= :timeStart)`);
        conditionParams.timeStart = startOfDay(startDate);
      }
      if (object?.endDate) {
        const endDate = new Date(object.endDate);
        condition = condition.concat(` AND (entity.updatedAt <= :timeEnd)`);
        conditionParams.timeEnd = endOfDay(endDate);
      }
      if (object?.startDate && object?.endDate) {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        condition = condition.concat(` AND (entity.updatedAt BETWEEN :timeStart AND :timeEnd)`);
        conditionParams.timeStart = startOfDay(startDate);
        conditionParams.timeEnd = endOfDay(endDate);
      }

      const addSelectDateFm = 
        object?.typeFilter == "day" ?
        `DATE_FORMAT(entity.updatedAt, "%Y-%m-%d") as timeFilter` :
        object?.typeFilter == "month" ?
        `DATE_FORMAT(entity.updatedAt, "%Y-%m") as timeFilter` : 
        `DATE_FORMAT(entity.updatedAt, "%Y") as timeFilter`;

      const listUser = await this.userRepository
        .createQueryBuilder("entity")
        .leftJoinAndSelect(
          "bookmaker",
          "bookmaker",
          "entity.bookmakerId = bookmaker.id"
        )
        .select("bookmaker.name as bookmakerName")
        .addSelect(addSelectDateFm)
        .addSelect("COUNT(entity.id) as count")
        .where(condition, conditionParams)
        .groupBy("bookmakerName, timeFilter")
        .orderBy("timeFilter", "ASC")
        .getRawMany();

      const response = Helper.checkAndGroupByTime(listUser, "user");
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminDashboardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async dataChartOrder(paginationDto: PaginationQueryDto) {
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      let condition = "user.usernameReal = ''";
      const conditionParams: any = {}
      if (object?.bookmaker > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = object?.bookmaker;
      }
      if (object?.startDate) {
        const startDate = new Date(object.startDate);
        condition = condition.concat(` AND (entity.createdAt >= :timeStart)`);
        conditionParams.timeStart = startOfDay(startDate);
      }
      if (object?.endDate) {
        const endDate = new Date(object.endDate);
        condition = condition.concat(` AND (entity.createdAt <= :timeEnd)`);
        conditionParams.timeEnd = endOfDay(endDate);
      }
      if (object?.startDate && object?.endDate) {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        condition = condition.concat(` AND (entity.createdAt BETWEEN :timeStart AND :timeEnd)`);
        conditionParams.timeStart = startOfDay(startDate);
        conditionParams.timeEnd = endOfDay(endDate);
      }

      const addSelectDateFm = 
        object?.typeFilter == "day" ?
        `DATE_FORMAT(entity.createdAt, "%Y-%m-%d") as timeFilter` :
        object?.typeFilter == "month" ?
        `DATE_FORMAT(entity.createdAt, "%Y-%m") as timeFilter` : 
        `DATE_FORMAT(entity.createdAt, "%Y") as timeFilter`;

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

      const response = Helper.checkAndGroupByTime(listDataReal, "order");
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminDashboardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async dataChartOrderAll(paginationDto: PaginationQueryDto) {
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      let condition = "user.usernameReal = ''";
      const conditionParams: any = {}
      if (object?.bookmaker > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = object?.bookmaker;
      }

      const addSelectDateFm = `DATE_FORMAT(entity.createdAt, "%Y-%m-%d") as timeFilter`;

      const [dataLottery, dataHilo, dataPoker] = await Promise.all([
        this.orderRepository
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
          .getRawMany(),
        this.playHistoryHiloRepository
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
          .addSelect("SUM(entity.totalPaymentWin - entity.revenue) as totalPaymentWin")
          .where(condition, conditionParams)
          .groupBy("bookmakerName, timeFilter")
          .orderBy("timeFilter", "ASC")
          .getRawMany(),
        this.playHistoryPokerRepository
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
          .addSelect("SUM(entity.paymentWin - entity.revenue) as totalPaymentWin")
          .where(condition, conditionParams)
          .groupBy("bookmakerName, timeFilter")
          .orderBy("timeFilter", "ASC")
          .getRawMany()
      ]);

      const dataLotteryFilter = Helper.checkAndGroupByTime(dataLottery, "order");
      const dataHiloFilter = Helper.checkAndGroupByTime(dataHilo, "order");
      const dataPokerFilter = Helper.checkAndGroupByTime(dataPoker, "order");
      const arrayFinal = dataLotteryFilter.concat(dataHiloFilter).concat(dataPokerFilter);
      const response = this.checkAndGroupByTime(arrayFinal);
      response.sort(
        (a: any, b: any) =>
          moment(a.timeFilter).valueOf() - moment(b.timeFilter).valueOf()
      )

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      console.log(error)
      this.logger.debug(
        `${AdminDashboardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  checkAndGroupByTime(array: any) {
    const timeMap: any = {};

    array.forEach((item: any) => {
      if (!timeMap[item.timeFilter]) {
        timeMap[item.timeFilter] = {
          ...item,
          count: Number(item.count),
          totalBet: Number(item.totalBet),
          totalPaymentWin: Number(item.totalPaymentWin),
        };
      } else {
        timeMap[item.timeFilter].count =
          Number(timeMap[item.timeFilter].count) + Number(item.count);
        timeMap[item.timeFilter].bookmakerName += ` - ${item.bookmakerName}`;
        timeMap[item.timeFilter].totalBet = 
          Number(timeMap[item.timeFilter].totalBet) + Number(item.totalBet);
        timeMap[item.timeFilter].totalPaymentWin =
          Number(timeMap[item.timeFilter].totalPaymentWin) +
          Number(item.totalPaymentWin);
      }
    });

    return Object.values(timeMap);
  }
}