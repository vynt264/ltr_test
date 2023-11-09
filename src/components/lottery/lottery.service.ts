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
import { CreateLotteryDto, UpdateLotteryDto } from "./dto/index";
import { Lottery } from "./lottery.entity";
@Injectable()
export class LotteryService {
  constructor(
    @InjectRepository(Lottery)
    private LotteryRepository: Repository<Lottery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(
    paginationQueryDto: PaginationQueryDto,
    user: any = null
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const Lotterys = await this.searchByLottery(
        paginationQueryDto,
        object,
        user
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        Lotterys,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchByLottery(
    paginationQuery: PaginationQueryDto,
    LotteryDto: any,
    user: any = null
  ) {
    const { error, member } = await this.getRoleById(user.id);

    if (error) return error;

    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.LotteryRepository.findAndCount({
      relations: ["user"],
      select: {
        id: true,
        createdAt: true,
        // user: {
        //   id: true,
        //   username: true,
        // },
      },
      where: this.holdQuery(LotteryDto, member),
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
          case "typeSearch":
            data.type = object.type;
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
          case "typeSearch":
            data.type = object.type;
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
      return {
        error: new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }

    return { member };
  }

  async getOneById(id: number): Promise<BaseResponse> {
    try {
      const foundLottery = await this.LotteryRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        foundLottery,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryService.name} is Logging error: ${JSON.stringify(error)}`
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

  async create(createLotteryDto: CreateLotteryDto): Promise<BaseResponse> {
    try {
      // const { userId: id } = createLotteryDto;

      // const { error, user } = await this.verifyUser(id);
      // if (error) return error;

      // const newLottery = {
      //   user: { id: user.id }
      // };
      // const createdLottery = this.LotteryRepository.create(newLottery);
      // await this.LotteryRepository.save(createdLottery);

      // return new SuccessResponse(
      //   STATUSCODE.COMMON_CREATE_SUCCESS,
      //   createdLottery,
      //   MESSAGE.CREATE_SUCCESS
      // );
    } catch (error) {
      this.logger.debug(
        `${LotteryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, updateLotteryDto: UpdateLotteryDto): Promise<any> {
    try {
      let foundLottery = await this.LotteryRepository.findOneBy({
        id,
      });

      if (!foundLottery) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Lottery with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundLottery = {
        ...foundLottery,
        ...updateLotteryDto,
        updatedAt: new Date(),
      };
      await this.LotteryRepository.save(foundLottery);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundLottery,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundLottery = await this.LotteryRepository.findOneBy({
        id,
      });

      if (!foundLottery) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Lottery with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.LotteryRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Lottery has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async processAward(createLotteryDto: CreateLotteryDto): Promise<BaseResponse> {
    try {

      const turnIndex = "";
      const type = "";

      // Tổng hợp Order request
      // init detail
      // save new lotery
      // call sang
      // response 
      // process payment (list transaction)
      // update order request



    } catch (error) {
      this.logger.debug(
        `${LotteryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

}
