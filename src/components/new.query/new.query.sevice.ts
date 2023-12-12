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
import { Order } from "../orders/entities/order.entity";
import { DataFake } from "./data.fake.entity";
import { CreateDataFakeRequestDto } from "./dto/create.data.fake.dto";
import { UpdateDataFakeRequestDto } from "./dto";
import { KeyMode } from "./enums/key.mode.enum";
export class NewQueryService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(DataFake)
    private dataFakeRepository: Repository<DataFake>,
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
      let listData: any = [];
      const listDataReal = await this.orderRepository.findAndCount({
        relations: ["user"],
        select: {
          user: {
            id: true,
            username: true,
            userInfo: {
              id: true,
              avatar: true
            }
          },
        },
        where: {
          paymentWin: MoreThan(AMOUNT_CHECK),
        },
        take: +perPage,
        skip,
        order: {
          createdAt: "DESC"
        }
      });

      listData = listDataReal[0];
      const limitDataFake = Number(perPage) - listDataReal[1];
      if (limitDataFake <= Number(perPage) && limitDataFake >= 0) {
        const dataFake: any = await this.dataFakeRepository.findAndCount({
          where: {
            keyMode: KeyMode.USER_WIN,
          },
          take: +limitDataFake,
          skip,
          order: {
            id: "DESC"
          }
        });

        listData = listData.concat(dataFake[0]);
      }

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
      let listData: any = [];
      const listDataReal = await this.orderRepository.findAndCount({
        relations: ["user"],
        select: {
          user: {
            id: true,
            username: true,
            userInfo: {
              id: true,
              avatar: true
            }
          },
        },
        take: +perPage,
        skip,
        order: {
          createdAt: "DESC",
        },
      });

      listData = listDataReal[0];
      const limitDataFake = Number(perPage) - listDataReal[1];
      if (limitDataFake <= Number(perPage) && limitDataFake >= 0) {
        const dataFake: any = await this.dataFakeRepository.findAndCount({
          where: {
            keyMode: KeyMode.USER_PLAYING,
          },
          take: +limitDataFake,
          skip,
          order: {
            id: "DESC"
          }
        });

        listData = listData.concat(dataFake[0]);
      }

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
      let listData: any = []
      const listDataReal = await this.orderRepository
        .createQueryBuilder("entity")
        .select("entity.type as gameType")
        .addSelect("COUNT(*) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .groupBy("entity.type")
        .skip(skip)
        .take(perPage)
        .getRawMany();

      listData = listDataReal;
      const limitDataFake = Number(perPage) - listDataReal.length;
      if (limitDataFake <= Number(perPage)) {
        const dataFake: any = await this.dataFakeRepository.findAndCount({
          where: {
            keyMode: KeyMode.FAVORITE_GAME,
          },
          take: +limitDataFake,
          skip,
          order: {
            id: "DESC"
          }
        });

        dataFake[0]?.map((fake: any) => {
          const newData = {
            gameType: fake?.gameType,
            count: fake?.numbPlayer,
            totalBet: fake?.totalBet
          }
          listData.push(newData);
        })
      }

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

  async createDataFake(createDto: CreateDataFakeRequestDto) {
    try {
      const createdDto = await this.dataFakeRepository.create(createDto);
      const dataFake = await this.dataFakeRepository.save(createdDto);
      const { id } = dataFake;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${NewQueryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async updateDataFake(
    id: number,
    updateDto: UpdateDataFakeRequestDto
  ): Promise<any> {
    try {
      let foundDtoUp = await this.dataFakeRepository.findOneBy({
        id,
      });

      if (!foundDtoUp) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Data fake with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (updateDto) {
        foundDtoUp = {
          ...foundDtoUp,
          ...updateDto,
        };
      }

      await this.dataFakeRepository.save(foundDtoUp);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundDtoUp,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${NewQueryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async deleteDataFake(id: number): Promise<any> {
    try {
      const foundUser = await this.dataFakeRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Data fake with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.dataFakeRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Data fake has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${NewQueryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
