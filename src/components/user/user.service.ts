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
import { CreateUserDto, UpdateUserDto } from "./dto/index";
import PermissionUserDto from "./dto/permission.dto";
import { User } from "./user.entity";
import { Wallet } from "../wallet/wallet.entity";
import { WalletHistory } from "../wallet/wallet.history.entity";
import { WalletCodeQueue } from "../wallet/wallet.code.queue";
import { PrefixEnum } from "../sys.config/enums/sys.config.enum";
@Injectable()
export class UserService {
  private username = "username";

  private role = "role";

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletHistory)
    private walletHisotryRepository: Repository<WalletHistory>,
    @InjectRepository(WalletCodeQueue)
    private walletCodeQueueRepository: Repository<WalletCodeQueue>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getByUsername(username: string, isAdmin = false) {
    let user = await this.userRepository.findOne({
      relations: ['bookmaker'],
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
        isAuth: true,
      },
      where: {
        username,
      },
    });

    // if (!user && !isAdmin) {
    //   const userDto = {
    //     username,
    //     password: process.env.USER_PASSWORD,
    //     isAuth: true,
    //   };
    //   const createdUser = this.userRepository.create(userDto);
    //   user = await this.userRepository.save(createdUser);
    //   const wlCodeQueue = await this.walletCodeQueueRepository.save({});
    //   const walletCode = PrefixEnum.WALLET_CODE + wlCodeQueue.id;
    //   // TODO lam torng so
    //   const walletDto = {
    //     walletCode: walletCode,
    //     user: { id: user.id },
    //     createdBy: user.username,
    //   };
    //   const walletCreate = this.walletRepository.create(walletDto);
    //   const wallet = await this.walletRepository.save(walletCreate);
    //   await this.walletHisotryRepository.save(wallet);
    // }

    return user;
  }

  async createWallet(user: User) {
    const wlCodeQueue = await this.walletCodeQueueRepository.save({});
    const walletCode = PrefixEnum.WALLET_CODE + wlCodeQueue.id;
    // TODO lam torng so
    const walletDto = {
      walletCode: walletCode,
      user: { id: user.id },
      createdBy: user.username,
    };
    const walletCreate = this.walletRepository.create(walletDto);
    const wallet = await this.walletRepository.save(walletCreate);
    await this.walletHisotryRepository.save(wallet);
  }

  async guestGetByUsername(
    username: string,
    usernameReal: string,
    isAdmin = false
  ) {
    let user = await this.userRepository.findOne({
      relations: ['bookmaker'],
      select: {
        id: true,
        username: true,
        password: true,
        role: true,
      },
      where: {
        username,
      },
    });

    if (!user && !isAdmin) {
      const userDto = {
        username,
        password: process.env.USER_PASSWORD,
        isAuth: false,
        usernameReal,
        bookmaker: { id: 1 },
      };
      const createdUser = this.userRepository.create(userDto);
      user = await this.userRepository.save(createdUser);
      const wlCodeQueue = await this.walletCodeQueueRepository.save({});
      const walletCode = PrefixEnum.WALLET_CODE + wlCodeQueue.id;

      const walletDto = {
        walletCode: walletCode,
        user: { id: user.id },
        createdBy: user.username,
        availableBalance: 20000000,
        balance: 20000000,
      };
      const walletCreate = this.walletRepository.create(walletDto);
      const wallet = await this.walletRepository.save(walletCreate);
      await this.walletHisotryRepository.save(wallet);
    }

    return user;
  }

  async getAll(paginationQuery: PaginationQueryDto): Promise<any> {
    try {
      const object: any = JSON.parse(paginationQuery.keyword);
      const users = await this.searchByUser(paginationQuery, object);
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        users,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async searchByUser(paginationQuery: PaginationQueryDto, user: any) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.userRepository.findAndCount({
      relations: ["bookmaker"],
      select: {
        id: true,
        username: true,
        createdAt: true,
        role: true,
        password: true,
        hashedRt: true,
        isBlocked: true,
        bookmaker: {
          id: true,
          name: true,
        }
      },
      where: this.holdQuery(user),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  holdQuery(object: any) {
    const data: any = {};
    // data.role = Like(`${UserRoles.MEMBER}`);
    if (!object) {
      return data;
    }

    for (const key in object) {
      switch (key) {
        case this.username:
          data.username = Like(`%${object.username}%`);
          break;
        case this.role:
          data.role = Like(`%${object.role}%`);
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

  async getOneById(id = 0): Promise<any> {
    try {
      const user = await this.userRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        user,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async userGetInfo(id = 0): Promise<any> {
    try {
      const user = await this.userRepository.findOne({
        relations: ['bookmaker'],
        select: {
          id: true,
          name: true,
          username: true,
          option: true,
          bookmaker: {
            id: true,
          }
        },
        where: {
          id: id,
          isDeleted: false,
          isBlocked: false,
        },
      });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        user,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async create(userDto: CreateUserDto): Promise<any> {
    try {
      const newUserReq = {
        bookmaker: { id: userDto?.bookmakerId },
        username: userDto?.username,
        password: userDto?.password,
      }
      const createdUser = await this.userRepository.create(newUserReq);
      const user = await this.userRepository.save(createdUser);
      const { id } = user;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserService.name} is Logging error: ${JSON.stringify(error)}`
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
    userDto: UpdateUserDto,
    ...options: any
  ): Promise<any> {
    const firstItem = options.find((x: any) => x !== undefined);
    try {
      let foundUser = await this.userRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `User with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (userDto) {
        foundUser = {
          ...foundUser,
          ...userDto,
          updatedAt: new Date(),
          hashPassword: null,
        };
      }

      if (options) {
        foundUser = {
          ...foundUser,
          ...firstItem,
          updatedAt: new Date(),
          hashPassword: null,
        };
      }
      await this.userRepository.save(foundUser);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.userRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `User with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.userRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `User has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async updatePermisson(
    id: number,
    updatePerDto: PermissionUserDto
  ): Promise<any> {
    const foundUser = await this.userRepository.findOneBy({
      id,
    });

    if (!foundUser) {
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        `User with id: ${id} not found!`,
        ERROR.NOT_FOUND
      );
    }

    const option = updatePerDto.permission
      ? updatePerDto.permission.join(",")
      : "";
    return this.update(id, null, { option });
  }
}
