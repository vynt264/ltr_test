import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, LessThanOrEqual, Like, MoreThan, Repository } from "typeorm";
import { PlayHistoryKeno } from "../admin.keno/entities/play.history.keno.entity";
import { SysConfigKeno } from "../admin.keno/entities/sys.config.keno.entity";
import { PaginationQueryDto } from "src/common/common.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { ERROR, MESSAGE, STATUSCODE, TypeLottery } from "src/system/constants";
import { ErrorResponse, SuccessResponse } from "src/system/BaseResponse";
import { Logger } from "winston";
import { Helper } from "src/common/helper";

@Injectable()
export class AdminKenoService {
  constructor(
    @InjectRepository(PlayHistoryKeno)
    private playHistoryKenoRepository: Repository<PlayHistoryKeno>,
    @InjectRepository(SysConfigKeno)
    private sysConfigKenoRepository: Repository<SysConfigKeno>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getHistory(paginationDto: PaginationQueryDto) {
    const { take: perPage, skip: page } = paginationDto;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const object: any = JSON.parse(paginationDto.keyword);
    let condition = "1 = 1";
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
    if (object?.isTestPlayer != undefined) {
      condition = condition.concat(` AND entity.isUserFake = ${object.isTestPlayer == "true" ? 1 : 0}`);
    }
    if (object?.code) {
      condition = condition.concat(` AND entity.code LIKE :codeFind`);
      conditionParams.codeFind = `%${object?.code}%`;
    }

    const [data, count] = await Promise.all([
      this.playHistoryKenoRepository
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
        .addSelect("entity.typeBet as typeBet")
        .addSelect("entity.kenoHitBet as kenoHitBet")
        .addSelect("entity.kenoHitResult as kenoHitResult")
        .addSelect("entity.multi as multi")
        .addSelect("entity.hits as hits")
        .addSelect("entity.revenue as revenue")
        .addSelect("entity.totalPaymentWin as totalPaymentWin")
        .addSelect("entity.isGameOver as isGameOver")
        .addSelect("entity.createdAt as createdAt")
        .addSelect("entity.createdBy as createdBy")
        .addSelect("entity.updatedAt as updatedAt")
        .addSelect("entity.updatedBy as updatedBy")
        .addSelect("entity.bookmakerId as bookmakerId")
        .addSelect("entity.id as id")
        .addSelect("entity.isUserFake as isUserFake")
        .where(condition, conditionParams)
        .orderBy("id", "DESC")
        .limit(perPage)
        .offset((page - 1) * perPage)
        .getRawMany(),
      this.playHistoryKenoRepository
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
    );;
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
    const listData = await this.sysConfigKenoRepository.find({})
    return new SuccessResponse(
      STATUSCODE.COMMON_SUCCESS,
      listData,
      MESSAGE.LIST_SUCCESS
    );
  }

  async updateConfig(
    id: number,
    sysConfigKenoDto: any,
    member: any
  ): Promise<any> {
    let foundSysConfigKeno = await this.sysConfigKenoRepository.findOneBy({
      id,
    });

    if (!foundSysConfigKeno) {
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        `SysConfigKeno with id: ${id} not found!`,
        ERROR.NOT_FOUND
      );
    }

    if (sysConfigKenoDto) {
      foundSysConfigKeno = {
        ...foundSysConfigKeno,
        ...sysConfigKenoDto,
        updatedBy: member.name,
        updatedAt: new Date(),
      };
    }

    await this.sysConfigKenoRepository.save(foundSysConfigKeno);

    return new SuccessResponse(
      STATUSCODE.COMMON_UPDATE_SUCCESS,
      "",
      MESSAGE.UPDATE_SUCCESS
    );
  }

  async report(paginationDto: PaginationQueryDto) {
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

    const listDataReal = await this.playHistoryKenoRepository
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
      .addSelect("SUM(entity.totalPaymentWin) as totalPaymentWin")
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
  }
}