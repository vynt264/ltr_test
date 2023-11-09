import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { Between, In, Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { UserRoles } from "../user/enums/user.enum";
import { User } from "../user/user.entity";
import { CreateSysConfigsDto, UpdateSysConfigsDto } from "./dto";
import {
  SYS_ITEM_ENUM,
  SYS_MODULE_ENUM,
  SysTtemCodeEnum,
} from "./enums/sys.config.enum";
import { SysConfig } from "./sys.config.entity";
import { Helper } from "../../common/helper";
import * as moment from "moment";

@Injectable()
export class SysConfigsService {
  constructor(
    @InjectRepository(SysConfig)
    private sysConfigsRepository: Repository<SysConfig>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async getAll(paginationQueryDto: PaginationQueryDto): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const SysConfigss = await this.searchBySysConfigs(
        paginationQueryDto,
        object
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        SysConfigss,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysConfigsService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchBySysConfigs(
    paginationQuery: PaginationQueryDto,
    SysConfigs: any
  ) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.sysConfigsRepository.findAndCount({
      select: {
        id: true,
        parentId: true,
        module: true,
        item: true,
        itemCode: true,
        value: true,
        value1: true,
        value2: true,
        isDeleted: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
      },
      where: this.holdQuery(SysConfigs, null),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  holdQuery(object: any = null, member: any = null) {
    const data: any = {};
    if (member?.id) {
      data.user = {
        id: member.id,
      };
      return data;
    }

    for (const key in object) {
      switch (key) {
        case "module":
          data.module = object.module;
          break;
        case "item":
          data.item = object.item;
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

    return data;
  }

  async getRoleById(id: any): Promise<any> {
    const user = await this.userRepository.findOne({
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
    if (!user) {
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        { message: `Not found userId ${id}` },
        ERROR.USER_NOT_FOUND
      );
    }

    return user;
  }

  async getOneById(id: number): Promise<BaseResponse> {
    try {
      const SysConfigs = await this.sysConfigsRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        SysConfigs,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysConfigsService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async create(
    createSysConfigsDto: CreateSysConfigsDto,
    user: User
  ): Promise<BaseResponse> {
    try {
      // const sysConfigs = await this.sysConfigsRepository.findOneBy({
      //   module: createSysConfigsDto.module,
      //   item: createSysConfigsDto.item,
      //   value: createSysConfigsDto.value,
      //   isDeleted: false,
      // });
      // if (sysConfigs) {
      //   return new ErrorResponse(
      //     STATUSCODE.COMMON_FAILED,
      //     { message: `This system config  already exist` },
      //     ERROR.CREATE_FAILED
      //   );
      // }

      const createdSysConfigs = await this.sysConfigsRepository.create(
        createSysConfigsDto
      );
      createdSysConfigs.createdAt = new Date();
      createdSysConfigs.createdBy = user?.name;
      createdSysConfigs.updatedBy = user?.name;
      await this.sysConfigsRepository.save(createdSysConfigs);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdSysConfigs,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysConfigsService.name} is Logging error: ${JSON.stringify(error)}`
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
    SysConfigsDto: UpdateSysConfigsDto,
    user: User
  ): Promise<any> {
    try {
      let foundSysConfigs = await this.sysConfigsRepository.findOneBy({
        id,
      });

      if (!foundSysConfigs) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `SysConfigs with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundSysConfigs = {
        ...foundSysConfigs,
        ...SysConfigsDto,
        updatedAt: new Date(),
        updatedBy: user?.name,
      };
      await this.sysConfigsRepository.save(foundSysConfigs);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundSysConfigs,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysConfigsService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async delete(id: number, user: User): Promise<BaseResponse> {
    try {
      const sysConfigFind = await this.sysConfigsRepository.findOneBy({
        id,
      });

      if (!sysConfigFind) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Ticket3 with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.sysConfigsRepository.delete(id);
      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `SysConfigs has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysConfigsService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
