import { Inject, Injectable, forwardRef } from "@nestjs/common";
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
import { CreateWalletInoutDto, UpdateWalletInoutDto } from "./dto/index";
import { WalletInout } from "./wallet.inout.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { RIGHTS } from "src/system/constants/rights";
import { ValidateRightsService } from "../admin/validate-rights/validate-rights.service";

@Injectable()
export class WalletInoutService {

  constructor(
    @InjectRepository(WalletInout)
    private walletInoutRepository: Repository<WalletInout>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,

    @Inject(forwardRef(() => ValidateRightsService))
    private validateRightsService: ValidateRightsService,

    @Inject("winston")
    private readonly logger: Logger,
  ) { }

  async getAll(paginationQuery: PaginationQueryDto): Promise<any> {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const object: any = JSON.parse(paginationQuery.keyword);
    try {
      const listData = await this.walletInoutRepository.findAndCount({
        relations: ["user", "user.bookmaker"],
        select: {
          user: {
            id: true,
            username: true,
            bookmaker: {
              id: true,
              name: true
            }
          }
        },
        where: this.getCondition(object, false),
        take: +perPage,
        skip,
        order: {
          id: "DESC",
        }
      });
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

  async getWalletHistory(paginationQuery: PaginationQueryDto, user: any): Promise<any> {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    // const object: any = JSON.parse(paginationQuery.keyword);

    const hasRight = await this.validateRightsService.hasRight({
      userId: user.id,
      rightsNeedCheck: [RIGHTS.AllowSearchFromBookmarker],
    });

    const object: any = JSON.parse(paginationQuery.keyword);
    if (!hasRight) {
      object.bookmakerId = user.bookmakerId;
    }
    try {
      const listData = await this.walletHistoryRepository.findAndCount({
        relations: ["user", "user.bookmaker", "user.userInfo"],
        select: {
          user: {
            id: true,
            username: true,
            usernameReal: true,
            bookmaker: {
              id: true,
              name: true
            },
            userInfo: {
              nickname: true,
            }
          }
        },
        where: this.getCondition(object, true),
        take: +perPage,
        skip,
        order: {
          hisId: "DESC",
        }
      });
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

  getCondition(object: any, isWalletHis: boolean) {
    const data: any = {};
    if (!object) {
      return data;
    }

    for (const key in object) {
      if (key === "username") {
        data.user = { username: Like(`%${object.username}%`) };
      }

      if (key === "nickname") {
        data.user = {
          userInfo: {
            nickname: Like(`%${object.nickname}%`)
          }
        }
      }

      if (key === "userId" && isWalletHis) {
        data.user = { id: object.userId };
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }

      if (key === "bookmakerId") {
        data.user = {
          ...data.user,
          bookmaker: { id: object.bookmakerId }
        };
      }

      if (key === "isTestPlayer") {
        data.user = {
          ...data.user,
          usernameReal: object.isTestPlayer == "true" ? Not("") : "",
        }
      }

      if (key === "orderId") {
        data.code = Like(`%${object.orderId}%`);
      }

      if (key === "typeTransaction") {
        data.typeTransaction = Like(`%${object.typeTransaction}%`);
      }

      if (key === "nccNote") {
        data.nccNote = Like(`%${object.nccNote}%`);
      }
    }

    return [data];
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