import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { Between, Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import { User } from "../user/user.entity";
import {
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { UserRoles } from "../user/enums/user.enum";
import { CreateSubWalletDto, UpdateSubWalletDto } from "./dto/index";
import { SubWallet } from "./sub.wallet.entity";
import { SubWalletHistory } from "./sub.wallet.history.entity";
@Injectable()
export class SubWalletService {
  constructor(
    @InjectRepository(SubWallet)
    private subWalletRepository: Repository<SubWallet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SubWalletHistory)
    private subWalletHistoryRepository: Repository<SubWalletHistory>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(
    paginationQueryDto: PaginationQueryDto,
    user: any = null
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const subWallets = await this.searchBySubWallet(
        paginationQueryDto,
        object,
        user
      );

      const sumAvaliableBalance = await this.subWalletRepository
        .createQueryBuilder('sub_wallet')
        .select('SUM(sub_wallet.availableBalance)', 'sum')
        .where('sub_wallet.isDelete = :isDelete', { isDelete: false })
        .andWhere('sub_wallet.isBlock = :isBlock', { isBlock: false })
        .getRawOne();

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        { subWallets, sumAvaliableBalance },
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SubWalletService.name} is Logging error: ${JSON.stringify(error)}`
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

      const SubWallets = await this.searchBySubWalletHistory(
        paginationQueryDto,
        object,
        user
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        SubWallets,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SubWalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchBySubWallet(
    paginationQuery: PaginationQueryDto,
    SubWalletDto: any,
    user: any = null
  ) {
    const { member } = await this.getRoleById(user.id);

    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.subWalletRepository.findAndCount({
      relations: ["user"],
      select: {
        id: true,
        createdAt: true,
        user: {
          id: true,
          username: true,
        },
        availableBalance: true,
        balance: true,
        createdBy: true,
        description: true,
        holdBalance: true,
        isBlock: true,
        isDelete: true,
        totalUsedAmount: true,
        walletCode: true,
        updatedAt: true,
        updatedBy: true,
        version: true,
        gameCode: true,
        subWalletCode: true,
      },
      where: this.holdQuery(SubWalletDto, member),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  async searchBySubWalletHistory(
    paginationQuery: PaginationQueryDto,
    SubWalletDto: any,
    user: any = null
  ) {
    const { member } = await this.getRoleById(user.id);

    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.subWalletHistoryRepository.findAndCount({
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
        totalUsedAmount: true,
        walletCode: true,
        updatedAt: true,
        updatedBy: true,
        version: true,
        gameCode: true,
        subWalletCode: true,
      },
      where: this.holdQuery(SubWalletDto, member),
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
          case "subWalletCode":
            data.subWalletCode = object.subWalletCode;
            break;
          case "gameCode":
            data.gameCode = object.gameCode;
            break;
          case "walletCode":
            data.walletCode = object.walletCode;
            break;
          case "id":
            data.id = object.id;
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
          case "subWalletCode":
            data.subWalletCode = object.subWalletCode;
            break;
          case "gameCode":
            data.gameCode = object.gameCode;
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
      const foundSubWallet = await this.subWalletRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        foundSubWallet,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SubWalletService.name} is Logging error: ${JSON.stringify(error)}`
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
    createSubWalletDto: CreateSubWalletDto,
    admin: User
  ): Promise<BaseResponse> {
    try {
      const { userId: id } = createSubWalletDto;

      const { error, user } = await this.verifyUser(id);
      if (error) return error;

      const newSubWallet = {
        user: { id: user.id },
        createdBy: admin?.name,
      };
      const createdSubWallet = this.subWalletRepository.create(newSubWallet);
      const subWallet = await this.subWalletRepository.save(createdSubWallet);

      const createdWalletHis = {
        ...subWallet,
        user: { id: user.id },
        createdBy: admin.name,
      };
      await this.subWalletHistoryRepository.save(createdWalletHis);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        subWallet,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SubWalletService.name} is Logging error: ${JSON.stringify(error)}`
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
    updateSubWalletDto: UpdateSubWalletDto,
    user: User
  ): Promise<any> {
    try {
      let foundSubWallet = await this.subWalletRepository.findOne({
        relations: ["user"],
        where: { id }
      });

      if (!foundSubWallet) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `SubWallet with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundSubWallet = {
        ...foundSubWallet,
        ...updateSubWalletDto,
        updatedAt: new Date(),
        updatedBy: user?.name,
        version: foundSubWallet.version + 1,
      };
      
      const subWallet = await this.subWalletRepository.save(foundSubWallet);
      const createdSubWalletHis = {
        ...subWallet,
        user: { id: user.id },
      };
      await this.subWalletHistoryRepository.save(createdSubWalletHis);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundSubWallet,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SubWalletService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundSubWallet = await this.subWalletRepository.findOneBy({
        id,
      });

      if (!foundSubWallet) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `SubWallet with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.subWalletRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `SubWallet has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SubWalletService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
