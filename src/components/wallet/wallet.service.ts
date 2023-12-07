import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { Between, Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import { User } from "../../components/user/user.entity";
import {
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { UserRoles } from "../user/enums/user.enum";
import { CreateWalletDto, UpdateWalletDto } from "./dto/index";
import { Wallet } from "./wallet.entity";
import { WalletHistory } from "./wallet.history.entity";
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WalletHistory)
    private walletHistoryRepository: Repository<WalletHistory>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(
    paginationQueryDto: PaginationQueryDto,
    user: any = null
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const wallets = await this.searchByWallet(
        paginationQueryDto,
        object,
        user
      );

      const sumAvaliableBalance = await this.walletRepository
        .createQueryBuilder('wallet')
        .select('SUM(wallet.availableBalance)', 'sum')
        .where('wallet.isDelete = :isDelete', { isDelete: false })
        .andWhere('wallet.isBlock = :isBlock', { isBlock: false })
        .getRawOne();

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        { wallets, sumAvaliableBalance },
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getAllHistoty(
    paginationQueryDto: PaginationQueryDto,
    user: any = null
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const Wallets = await this.searchByWalletHistory(
        paginationQueryDto,
        object,
        user
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        Wallets,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchByWallet(
    paginationQuery: PaginationQueryDto,
    walletDto: any,
    user: any = null
  ) {
    const { member } = await this.getRoleById(user.id);

    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.walletRepository.findAndCount({
      relations: ["user"],
      select: {
        id: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
        },
        availableBalance: true,
        totalAvailableBalance: true,
        balance: true,
        createdBy: true,
        description: true,
        holdBalance: true,
        isBlock: true,
        isDelete: true,
        totalBalance: true,
        totalUsedAmount: true,
        walletCode: true,
        updatedAt: true,
        updatedBy: true,
        version: true,
        totalDeposit: true,
      },
      where: this.holdQuery(walletDto, member),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  async searchByWalletHistory(
    paginationQuery: PaginationQueryDto,
    walletDto: any,
    user: any = null
  ) {
    const { member } = await this.getRoleById(user.id);

    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.walletHistoryRepository.findAndCount({
      relations: ["user"],
      select: {
        id: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
        },
        hisId: true,
        availableBalance: true,
        balance: true,
        createdBy: true,
        description: true,
        holdBalance: true,
        isBlock: true,
        isDelete: true,
        totalBalance: true,
        totalUsedAmount: true,
        walletCode: true,
        updatedAt: true,
        updatedBy: true,
        version: true,
        totalDeposit: true,
      },
      where: this.holdQuery(walletDto, member),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  holdQuery(object: any = null, member: any = null) {
    const data: any = {};
    if (member) {
      data.user = { id: member.id };
      if (!object) return data;
      for (const key in object) {
        switch (key) {
          case "walletCode":
            data.walletCode = object.walletCode;
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
    } else {
      if (!object) return data;

      for (const key in object) {
        switch (key) {
          case "userId":
            data.user = {
              id: object.userId,
            };
            data.user.id = object.userId;
            break;
          case "username":
            data.user = {
              username: object.username,
            };
            break;
          case "walletCode":
            data.walletCode = object.walletCode;
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
    }
    return data;
  }

  async getRoleById(id: number): Promise<any> {
    const member = await this.userRepository.findOne({
      select: {
        id: true,
        isBlocked: true,
      },
      where: {
        id,
        role: UserRoles.MEMBER,
        isBlocked: false,
      },
    });
    if (!member) {
      // TODO test
      return {
        error: new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }

    return { member: member };
  }

  async getOneById(id: number): Promise<BaseResponse> {
    try {
      const foundWallet = await this.walletRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        foundWallet,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async verifyUser(id: any): Promise<{ error: ErrorResponse; user: User }> {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
      },
      where: {
        id,
      },
    });
    if (!user) {
      return {
        error: new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
        user: null,
      };
    }

    return { error: null, user };
  }

  async create(
    createWalletDto: CreateWalletDto,
    admin: User
  ): Promise<BaseResponse> {
    try {
      const { userId: id } = createWalletDto;

      const { error, user } = await this.verifyUser(id);
      if (error) return error;

      const newWallet = {
        user: { id: user.id },
        createdBy: admin.name,
      };
      const createdWallet = this.walletRepository.create(newWallet);
      const wallet = await this.walletRepository.save(createdWallet);
      await this.walletHistoryRepository.save(wallet);
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        wallet,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(
    id: number,
    updateWalletDto: UpdateWalletDto,
    user: User
  ): Promise<any> {
    try {
      let foundWallet = await this.walletRepository.findOne({
        relations: ["user"],
        where: { id }
      });

      if (!foundWallet) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Wallet with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundWallet = {
        ...foundWallet,
        ...updateWalletDto,
        updatedAt: new Date(),
        updatedBy: user?.name,
        version: foundWallet.version + 1,
      };
      const wallet = await this.walletRepository.save(foundWallet);
      const createdWalletHis = {
        ...wallet,
        user: { id: foundWallet.user.id },
      };
      await this.walletHistoryRepository.save(createdWalletHis);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        createdWalletHis,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async delete(id: number): Promise<BaseResponse> {
    try {
      const foundWallet = await this.walletRepository.findOneBy({
        id,
      });

      if (!foundWallet) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Wallet with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.walletRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Wallet has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${WalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
