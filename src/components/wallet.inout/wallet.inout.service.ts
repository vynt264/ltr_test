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
import { CreateWalletInoutDto, UpdateWalletInoutDto } from "./dto/index";
import { WalletInout } from "./wallet.inout.entity";
@Injectable()
export class WalletInoutService { 

  constructor(
    @InjectRepository(WalletInout)
    private walletInoutRepository: Repository<WalletInout>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.walletInoutRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletInoutService.name} is Logging error: ${JSON.stringify(error)}`
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
      const listData = await this.walletInoutRepository.findBy({
        user: { id: userId }
      });
      return listData;
    } catch (error) {
      this.logger.debug(
        `${WalletInoutService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateWalletInoutDto, user: any): Promise<any> {
    try {
      const createDtoUp = {
        ...createDto,
        timeIn: new Date(),
        createdBy: user.name,
        user: { id: createDto.userId }
      }
      const createdWalletInout = await this.walletInoutRepository.create(createDtoUp);
      const WalletInout = await this.walletInoutRepository.save(createdWalletInout);
      const { id } = WalletInout;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletInoutService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, WalletInoutDto: UpdateWalletInoutDto, user: any): Promise<any> {
    try {
      let foundWalletInout = await this.walletInoutRepository.findOneBy({
        id,
      });

      if (!foundWalletInout) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `WalletInout with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (WalletInoutDto) {
        foundWalletInout = {
          ...foundWalletInout,
          ...WalletInoutDto,
          updatedBy: user.name,
          timeOut: new Date()
        };
      }

      await this.walletInoutRepository.save(foundWalletInout);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletInoutService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.walletInoutRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `WalletInout with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.walletInoutRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `WalletInout has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletInoutService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}