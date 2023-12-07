import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { Between, Like, Not, Repository } from "typeorm";
import { Logger } from "winston";
import { CreatePromotionHistoriesDto, UpdatePromotionHistoriesDto } from "./dto/index";
import { PromotionHistories } from "./promotion.history.entity";
import { CoinWalletHistories } from "../coin.wallet.history/coin.wallet.history.entiry";
import { ProCategory, ProType } from "../promotion/enums/promotion.enum";
@Injectable()
export class PromotionHistoriesService { 

  constructor(
    @InjectRepository(PromotionHistories)
    private promotionHistoriesRepository: Repository<PromotionHistories>,
    @Inject("winston")
    private readonly logger: Logger,
    @InjectRepository(CoinWalletHistories)
    private coinWalletHistoryRepository: Repository<CoinWalletHistories>,
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.promotionHistoriesRepository.find({
        relations: ["user", "promotion"],
        select: {
          id: true,
          user: {
            id: true,
            username: true,
          },
          promotion: {
            id: true,
            category: true,
            type: true,
            name: true,
            createdAt: true,
          },
          moneyReward: true,
          createdAt: true,
        }
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionHistoriesService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchByUser(paginationQuery: PaginationQueryDto): Promise<any> {
    try {
      const object: any = JSON.parse(paginationQuery.keyword);
      const { take: perPage, skip: page } = paginationQuery;
      if (page <= 0) {
        return "The skip must be more than 0";
      }
      const skip = +perPage * +page - +perPage;

      const listData = await this.promotionHistoriesRepository.findAndCount({
        relations: ["user", "promotion"],
        select: {
          id: true,
          user: {
            id: true,
            username: true,
          },
          promotion: {
            id: true,
            category: true,
            type: true,
            name: true,
            createdAt: true,
          },
          moneyReward: true,
          createdAt: true,
        },
        where: this.holdQuerry(object),
        take: +perPage,
        skip,
        order: { createdAt: paginationQuery.order },
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionHistoriesService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  holdQuerry(object: any) {
    const data: any = {};
    if (!object) {
      return data;
    }

    for (const key in object) {
      switch (key) {
        case "username":
          data.user = { username: object.username };
          break;
        case "type":
          data.promotion = { type: object.type };
          break;
        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }
    }

    return [data];
  }

  async getInfoByUserId(userId: number): Promise<any> {
    try {
      const listData = await this.promotionHistoriesRepository
        .createQueryBuilder('promotionHis')
        .select('promotionHis.user.id', 'userId')
        .addSelect('promotion.category', 'promotionCategory')
        .addSelect('SUM(promotionHis.moneyReward) as moneyReward')
        .innerJoin('promotionHis.promotion', 'promotion')
        .where(`promotionHis.user.id = "${userId}"`)
        .groupBy('promotion.category')
        .getRawMany();
      
      const listDataCoin = await this.coinWalletHistoryRepository.find({
        relations: ["coinWallet"],
        where: {
          coinWallet: { user: { id: userId } },
          type: Not(ProType.CHANGE_COIN)
        }
      });
      let coinRecived = 0
      if (listDataCoin?.length > 0) {
        listDataCoin.map((item) => {
          coinRecived =+ Number(item?.amount);
        })
      }
      
      let response: any = null;
      if (listData?.length > 0) {
        let sumReward = 0, sumGeneralReward = 0, sumChangeCoin = 0;
        listData.map((data) => {
          if (data?.promotionCategory == ProCategory.GENERAL) {
            sumGeneralReward += Number(data?.moneyReward);
          }
          if (data?.promotionType == ProType.CHANGE_COIN) {
            sumChangeCoin += Number(data?.moneyReward);
          }
          sumReward += Number(data?.moneyReward);
        });
        response = {
          userId: listData[0]?.userId,
          sumReward: sumReward,
          sumGeneralReward: sumGeneralReward,
          sumChangeCoin: sumChangeCoin,
          coinRecived: coinRecived
        }
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        response,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionHistoriesService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreatePromotionHistoriesDto): Promise<any> {
    try {
      const createDtoFull = {
        user: { id: createDto?.userId},
        promotion: { id: createDto?.promotionId},
        moneyReward: createDto?.moneyReward,
      }
      const createdPromotion = await this.promotionHistoriesRepository.create(createDtoFull);
      const promotion = await this.promotionHistoriesRepository.save(createdPromotion);
      const { id } = promotion;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionHistoriesService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, promotionHistoriesDto: UpdatePromotionHistoriesDto): Promise<any> {
    try {
      let foundPromotion = await this.promotionHistoriesRepository.findOneBy({
        id,
      });

      if (!foundPromotion) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Promotion with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (promotionHistoriesDto) {
        foundPromotion = {
          ...foundPromotion,
          ...promotionHistoriesDto,
        };
      }

      await this.promotionHistoriesRepository.save(foundPromotion);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionHistoriesService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async delete(id: number): Promise<any> {
    try {
      const foundUser = await this.promotionHistoriesRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Promotion with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.promotionHistoriesRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Promotion has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionHistoriesService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}