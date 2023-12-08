import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { Between, Like, MoreThan, Repository } from "typeorm";
import { Logger } from "winston";
import { OrderRequest } from "../order.request/order.request.entity";

export class NewQueryService {
  constructor(
    @InjectRepository(OrderRequest)
    private orderRequestRepository: Repository<OrderRequest>,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async getListUserWin(paginationQuery: PaginationQueryDto) {
    const AMOUNT_CHECK = 0;
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    try {
      const listData = await this.orderRequestRepository.findAndCount({
        relations: ["user"],
        select: {
          user: {
            id: true,
            username: true,
          },
        },
        where: {
          paymentWin: MoreThan(AMOUNT_CHECK),
        },
        take: +perPage,
        skip,
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${NewQueryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getListUserPlaying(paginationQuery: PaginationQueryDto) {
    const NUM_LIMIT = 20;
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    try {
      const listData = await this.orderRequestRepository.findAndCount({
        relations: ["user"],
        select: {
          user: {
            id: true,
            username: true,
          },
        },
        take: +perPage,
        skip,
        order: {
          id: "DESC",
        },
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${NewQueryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getListFavoriteGame(paginationQuery: PaginationQueryDto) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    try {
      const listData = await this.orderRequestRepository
        .createQueryBuilder("entity") // Đặt alias cho thực thể
        .select("entity.type as gameType")
        .addSelect("COUNT(*) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .groupBy("entity.type")
        .skip(skip)
        .take(perPage)
        .getRawMany();
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${NewQueryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }
}
