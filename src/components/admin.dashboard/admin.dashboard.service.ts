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

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private userService: UserService,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async dataChartUser(paginationDto: PaginationQueryDto) {
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      let condition = "entity.usernameReal = '' AND entity.role = 'member'";
      const conditionParams: any = {}
      if (object?.bookmakerId > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = object?.bookmakerId;
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

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listUser,
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
      if (object?.bookmakerId > 0) {
        condition = condition.concat(` AND bookmaker.id = :bookmarkerFind`);
        conditionParams.bookmarkerFind = object?.bookmakerId;
      }
      const addSelectDateFm = `DATE_FORMAT(entity.createdAt, "%Y-%m-%d") as timeFilter`;

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
        `${AdminDashboardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }
}