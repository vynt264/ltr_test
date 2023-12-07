import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { Between, Like, Repository } from "typeorm";
import { Logger } from "winston";
import { CreateCoinWalletDto, UpdateCoinWalletDto } from "./dto";
import { CoinWallet } from "./coin.wallet.entity";
@Injectable()
export class CoinWalletService { 

  constructor(
    @InjectRepository(CoinWallet)
    private coinWalletRepository: Repository<CoinWallet>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.coinWalletRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletService.name} is Logging error: ${JSON.stringify(error)}`
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
      const listData = await this.coinWalletRepository.findOne({
        where: {
            user: { id: userId }
        }
      });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getById(id: number): Promise<any> {
    try {
      let foundCoinWallet = await this.coinWalletRepository.findOneBy({
        id,
      });
      return foundCoinWallet;
    } catch (error) {
      this.logger.debug(
        `${CoinWalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async create(createDto: CreateCoinWalletDto): Promise<any> {
    try {
      const dtoFull = {
        ...createDto,
        user: { id: createDto?.userId }
      }
      const createdCoinWallet = await this.coinWalletRepository.create(dtoFull);
      const coinWallet = await this.coinWalletRepository.save(createdCoinWallet);
      const { id } = coinWallet;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, CoinWalletDto: UpdateCoinWalletDto): Promise<any> {
    try {
      let foundCoinWallet = await this.coinWalletRepository.findOneBy({
        id,
      });

      if (!foundCoinWallet) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `CoinWallet with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (CoinWalletDto) {
        foundCoinWallet = {
          ...foundCoinWallet,
          ...CoinWalletDto,
        };
      }

      await this.coinWalletRepository.save(foundCoinWallet);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.coinWalletRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `CoinWallet with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.coinWalletRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `CoinWallet has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CoinWalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}