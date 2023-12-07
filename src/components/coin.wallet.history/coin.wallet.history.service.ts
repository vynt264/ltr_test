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
import { CreateCoinWalletHistoryDto, UpdateCoinWalletHistoryDto } from "./dto";
import { CoinWalletHistories } from "./coin.wallet.history.entiry";
import { CoinWalletType } from "./enums/coin.wallet.history.enum";
import { CoinWallet } from "../coin.wallet/coin.wallet.entity";
@Injectable()
export class CoinWalletHistoryService { 

  constructor(
    @InjectRepository(CoinWalletHistories)
    private coinWalletHistoryRepository: Repository<CoinWalletHistories>,
    @Inject("winston")
    private readonly logger: Logger,
    @InjectRepository(CoinWallet)
    private coinWalletRepository: Repository<CoinWallet>,
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.coinWalletHistoryRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getByUserId(userId: number): Promise<any> {
    try {
      const listData = await this.coinWalletHistoryRepository.findOne({
        relations: ["coinWallet"],
        where: {
            coinWallet: { user: { id: userId }}
        }
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getCoinRewardByUserId(userId: number): Promise<any> {
    try {
      const listData = await this.coinWalletHistoryRepository.find({
        relations: ["coinWallet"],
        where: {
            coinWallet: { user: { id: userId }},
            type: Not('coin_change')
        }
      });
      let coin = 0
      if (listData?.length > 0) {
        listData.map((item) => {
            coin =+ item?.amount;
        })
      }
      return coin;
    } catch (error) {
      this.logger.debug(
        `${CoinWalletHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateCoinWalletHistoryDto): Promise<any> {
    try {
      const dtoFull = {
        ...createDto,
        coinWallet: { id: createDto?.coinWalletId }
      }
      const createdCoinWalletHistory = await this.coinWalletHistoryRepository.create(dtoFull);
      const coinWalletHistory = await this.coinWalletHistoryRepository.save(createdCoinWalletHistory);
      
      let coinWallet = await this.coinWalletRepository.findOne({
        where: { id: createDto?.coinWalletId }
      });
      if (createDto?.type != CoinWalletType.CHANGE_COIN) {
        coinWallet = {
          ...coinWallet,
          balance: Number(coinWallet?.balance) + Number(createDto?.amount)
        }
      } else {
        coinWallet = {
          ...coinWallet,
          balance: Number(coinWallet?.balance) - Number(createDto?.amount)
        }
      }
      await this.coinWalletRepository.save(coinWallet);

      const { id } = coinWalletHistory;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, coinWalletHistoryDto: UpdateCoinWalletHistoryDto): Promise<any> {
    try {
      let foundCoinWalletHistory = await this.coinWalletHistoryRepository.findOneBy({
        id,
      });

      if (!foundCoinWalletHistory) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `CoinWalletHistory with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (coinWalletHistoryDto) {
        foundCoinWalletHistory = {
          ...foundCoinWalletHistory,
          ...coinWalletHistoryDto,
        };
      }

      await this.coinWalletHistoryRepository.save(foundCoinWalletHistory);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletHistoryService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.coinWalletHistoryRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `CoinWalletHistory with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.coinWalletHistoryRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `CoinWalletHistory has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}