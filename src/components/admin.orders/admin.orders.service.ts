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
export class AdminOrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private userService: UserService,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async findAll(paginationDto: PaginationQueryDto) {
    const { take: perPage, skip: page } = paginationDto;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      const listDataReal = await this.orderRepository.findAndCount({
        relations: ["user", "user.bookmaker"],
        select: {
          user: {
            id: true,
            username: true,
            bookmaker: {
              id: true,
              name: true
            }
          },
        },
        where: this.handleQuery(object),
        take: +perPage,
        skip,
        order: {
          createdAt: "DESC"
        }
      });

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
      return null;
    }

    for (const key in object) {
      if (key === "username") {
        data.user = { username: Like(`%${object.username}%`) };
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }
    }

    return [data];
  }

  async reportAll(bookmakerId: number, type: string) {
    try {
      let condition = "entity.status = 'closed'";
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
      let condition = "entity.status = 'closed'";
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

  async reportDetailByTime(bookmakerId: number, type: string) {
    try {
      let condition = "entity.status = 'closed' AND entity.created_at > DATE_SUB(now(), INTERVAL 6 MONTH)";
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
}