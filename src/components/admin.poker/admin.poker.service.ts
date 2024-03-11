import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, LessThanOrEqual, Like, MoreThan, Repository } from "typeorm";
import { PlayHistoryPoker } from "./entities/play.history.poker.entity";
import { SysConfigPoker } from "./entities/sys.config.poker.entity";
import { PaginationQueryDto } from "src/common/common.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ERROR, MESSAGE, STATUSCODE, TypeLottery } from "src/system/constants";
import { ErrorResponse, SuccessResponse } from "src/system/BaseResponse";
import { Logger } from "winston";
import { Helper } from "src/common/helper";

@Injectable()
export class AdminPokerService {
  constructor(
    @InjectRepository(PlayHistoryPoker)
    private playHistoryPokerRepository: Repository<PlayHistoryPoker>,
    @InjectRepository(SysConfigPoker)
    private sysConfigPokerRepository: Repository<SysConfigPoker>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getHistory(paginationDto: PaginationQueryDto) {
    const { take: perPage, skip: page } = paginationDto;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    try {
      const object: any = JSON.parse(paginationDto.keyword);
      let condition = "entity.isUserFake = 0";
      const conditionParams: any = {}
      if (object?.bookmakerId > 0) {
        condition = condition.concat(` AND entity.bookmakerId = :bookmarkerFind`);
        conditionParams.bookmarkerFind = object?.bookmakerId;
      }
      if (object?.username) {
        condition = condition.concat(` AND entity.username LIKE :usernameFind`);
        conditionParams.usernameFind = `%${object?.username}%`;
      }
      if (object?.nickname) {
        condition = condition.concat(` AND userInfo.nickname LIKE :nicknameFind`);
        conditionParams.nicknameFind = `%${object?.nickname}%`;
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

      const [data, count] = await Promise.all([
        this.playHistoryPokerRepository
          .createQueryBuilder("entity")
          .leftJoinAndSelect(
            "user_info",
            "userInfo",
            "entity.userId = userInfo.user.id"
          )
          .leftJoinAndSelect(
            "bookmaker",
            "bookmaker",
            "entity.bookmakerId = bookmaker.id"
          )
          .select("bookmaker.name as bookmakerName")
          .addSelect("userInfo.nickname as nickname")
          .addSelect("entity.userId as userId")
          .addSelect("entity.username as username")
          .addSelect("entity.code as code")
          .addSelect("entity.play1st as play1st")
          .addSelect("entity.play2nd as play2nd")
          .addSelect("entity.revenue as revenue")
          .addSelect("entity.paymentWin as paymentWin")
          .addSelect("entity.createdAt as createdAt")
          .addSelect("entity.createdBy as createdBy")
          .addSelect("entity.updatedAt as updatedAt")
          .addSelect("entity.updatedBy as updatedBy")
          .addSelect("entity.isGameOver as isGameOver")
          .addSelect("entity.rewardTitle as rewardTitle")
          .addSelect("entity.bookmakerId as bookmakerId")
          .addSelect("entity.multi as multi")
          .addSelect("entity.id as id")
          .where(condition, conditionParams)
          .orderBy("id", "DESC")
          .limit(perPage)
          .offset((page - 1) * perPage)
          .getRawMany(),
        this.playHistoryPokerRepository
          .createQueryBuilder("entity")
          .leftJoinAndSelect(
            "user_info",
            "userInfo",
            "entity.userId = userInfo.user.id"
          )
          .leftJoinAndSelect(
            "bookmaker",
            "bookmaker",
            "entity.bookmakerId = bookmaker.id"
          )
          .select("entity.id as id")
          .where(condition, conditionParams)
          .orderBy("id", "DESC")
          .getCount(),
      ]);
      const response: any = [data, count];
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminPokerService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  queryHis(object: any) {
    const data: any = { isUserFake: false };
    if (!object) {
      return data;
    }

    for (const key in object) {
      if (key === "username") {
        data.username = Like(`%${object.username}%`);
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }

      if (key === "bookmakerId") {
        data.bookmakerId = object.bookmakerId;
      }

      if (key === "code") {
        data.code = object.code;
      }
    }

    return [data];
  }

  async getConfig() {
    try {
      const listData = await this.sysConfigPokerRepository.find({})
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminPokerService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async updateConfig(
    id: number,
    sysConfigPokerDto: any,
    member: any
  ): Promise<any> {
    try {
      let foundSysConfigPoker = await this.sysConfigPokerRepository.findOneBy({
        id,
      });

      if (!foundSysConfigPoker) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `SysConfigHilo with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (sysConfigPokerDto) {
        foundSysConfigPoker = {
          ...foundSysConfigPoker,
          ...sysConfigPokerDto,
          updatedBy: member.name,
          updatedAt: new Date(),
        };
      }

      await this.sysConfigPokerRepository.save(foundSysConfigPoker);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminPokerService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async report(paginationDto: PaginationQueryDto) {
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

      const listDataReal = await this.playHistoryPokerRepository
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

      const dataResul: any = [];
      listDataReal?.map((item) => {
        const record = {
          bookmakerName: item?.bookmakerName,
          count: item?.count,
          timeFilter: item?.timeFilter,
          totalBet: Number(item?.totalBet),
          totalPaymentWin: Number(item?.totalBet) - Number(item?.totalPaymentWin)
        }
        dataResul.push(record);
      })
      const response = Helper.checkAndGroupByTime(dataResul, "hilo");

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${AdminPokerService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }
}