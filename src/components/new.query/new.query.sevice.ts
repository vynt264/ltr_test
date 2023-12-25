import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { Between, LessThan, Like, MoreThan, Repository } from "typeorm";
import { Logger } from "winston";
import { Order } from "../orders/entities/order.entity";
import { DataFake } from "./data.fake.entity";
import { CreateDataFakeRequestDto } from "./dto/create.data.fake.dto";
import { UpdateDataFakeRequestDto } from "./dto";
import { KeyMode } from "./enums/key.mode.enum";
import { TypeLottery } from "../lottery.award/enums/status.dto";
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
      if (limitDataFake <= Number(perPage) && limitDataFake > 0) {
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
      if (limitDataFake <= Number(perPage) && limitDataFake > 0) {
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
      const listData: any = []
      const listDataReal = await this.orderRepository
        .createQueryBuilder("entity")
        .select("entity.type as gameType")
        .addSelect("entity.seconds as seconds")
        .addSelect("COUNT(*) as count")
        .addSelect("SUM(entity.revenue) as totalBet")
        .groupBy("entity.type, entity.seconds")
        .skip(skip)
        .take(perPage)
        .getRawMany();

      listDataReal?.map((item: any) => {
        const dataCv = {
          gameType: `${item?.gameType}${
            Number(item.seconds) == 0 ? "45" : item.seconds
          }s`,
          count: item?.count,
          totalBet: item?.totalBet
        }
        listData.push(dataCv);
      });

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

  async getDataFake(key: string) {
    try {
      console.log("key: ", key)
      const listData = await this.dataFakeRepository.findAndCount({
        where: {
          keyMode: key,
        },
        order: {
          id: "DESC",
        }
      })
      console.log("listData: ", listData)
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

  getRandomValueFromArray(arr: any) {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }

  getRandomNumberInRange(min: number, max: number) {
    // Kiểm tra nếu min không phải là bội số của 1000, tăng giá trị min cho đến khi nó là bội số của 1000
    while (min % 1000 !== 0) {
      min++;
    }
    // Tính toán số lượng bội số của 1000 trong khoảng
    const numberOfMultiples = Math.floor((max - min + 1) / 1000);
    // Chọn một số nguyên ngẫu nhiên từ 0 đến numberOfMultiples - 1
    const randomIndex = Math.floor(Math.random() * numberOfMultiples);
    // Tính toán giá trị cuối cùng bằng cách thêm số nguyên ngẫu nhiên nhân với 1000
    const randomNumber = min + randomIndex * 1000;
    return randomNumber;
  }

  getRandomNumber(min: number, max: number) {
    const numberOfMultiples = Math.floor((max - min + 1));
    const randomIndex = Math.floor(Math.random() * numberOfMultiples);
    const randomNumber = min + randomIndex;
    return randomNumber;
  }

  async createDataFakeAuto() {
    try {
      const usernameFakeList = [
        "Đời Đày Đọa",
        "Chim Một Nắng",
        "Sexy Girl",
        "Bố Mày Tới",
        "Lò Vịt Quay",
        "Thái Dương Tâm",
        "Âu Văn Dương",
        "Mù Văn Tới",
        "Thẳng Không Ham",
        "Thua Không Cay",
        "Thỏ Lông Trắng",
        "Gà Đi Bộ",
        "Sếu Đầu Đỏ",
        "Vịt Bay Màu",
        "Họa Sĩ Mù"
      ];
      const gameTypeList = [
        TypeLottery.XSMB_45_S,
        TypeLottery.XSMB_180_S,
        TypeLottery.XSMT_45_S,
        TypeLottery.XSMT_180_S,
        TypeLottery.XSMN_45_S,
        TypeLottery.XSMN_180_S,
        TypeLottery.XSSPL_45_S,
        TypeLottery.XSSPL_60_S,
        TypeLottery.XSSPL_90_S,
        TypeLottery.XSSPL_120_S,
        TypeLottery.XSSPL_360_S,
      ]

      const newDtoUserWin = {
        keyMode: KeyMode.USER_WIN,
        username: this.getRandomValueFromArray(usernameFakeList),
        gameType: this.getRandomValueFromArray(gameTypeList),
        paymentWin: this.getRandomNumberInRange(10000000, 100000000),
      }

      const newDtoUserPlay = {
        keyMode: KeyMode.USER_PLAYING,
        username: this.getRandomValueFromArray(usernameFakeList),
        gameType: this.getRandomValueFromArray(gameTypeList),
        revenue: this.getRandomNumberInRange(100000, 10000000),
      }

      const newDtoFavourite = {
        keyMode: KeyMode.FAVORITE_GAME,
        gameType: this.getRandomValueFromArray(gameTypeList),
        totalBet: this.getRandomNumberInRange(5000000, 100000000),
        numbPlayer: this.getRandomNumber(50, 3000),
      }

      const listCrreateDto = [newDtoUserWin, newDtoUserPlay, newDtoFavourite];
      const createAll = listCrreateDto.map(async (dto: any) => {
        const createdDto = await this.dataFakeRepository.create(dto);
        await this.dataFakeRepository.save(createdDto);
      });
      await Promise.all(createAll);
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

  async deteleDataFakeAuto() {
    const currentDate = new Date();
    const timeCheck = new Date(currentDate);
    timeCheck.setHours(currentDate.getHours() - 1);
    const data = await this.dataFakeRepository.find({
      where: {
        createdAt: LessThan(timeCheck),
      }
    });
    if (data?.length > 0) {
      data.map(async (item) => {
        await this.dataFakeRepository.delete(item?.id)
      })
    }
  }
}
