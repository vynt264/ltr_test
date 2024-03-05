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
    const skip = +perPage * +page - +perPage;
    const object: any = JSON.parse(paginationDto.keyword);
    try {
      const listData = await this.playHistoryPokerRepository.findAndCount({
        where: this.queryHis(object),
        take: +perPage,
        skip,
        order: {
          id: "DESC",
        }
      })
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
}