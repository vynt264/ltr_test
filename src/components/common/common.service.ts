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
import { CreateCommonDto, UpdateCommonDto } from "./dto/index";
import { Common } from "./common.entity";
@Injectable()
export class CommonService { 

  constructor(
    @InjectRepository(Common)
    private commonRepository: Repository<Common>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.commonRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CommonService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getByCommonKey(common_key: string): Promise<any> {
    try {
      const data = await this.commonRepository.findOneBy({ common_key });
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        data,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CommonService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateCommonDto): Promise<any> {
    try {
      const createdCommon = await this.commonRepository.create(createDto);
      const common = await this.commonRepository.save(createdCommon);
      const { id } = common;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CommonService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, CommonDto: UpdateCommonDto, user: any): Promise<any> {
    try {
      let foundCommon = await this.commonRepository.findOneBy({
        id,
      });

      if (!foundCommon) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Common with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (CommonDto) {
        foundCommon = {
          ...foundCommon,
          ...CommonDto,
          updatedBy: user?.name,
          updatedAt: new Date(),
        };
      }

      await this.commonRepository.save(foundCommon);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CommonService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.commonRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Common with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.commonRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Common has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${CommonService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}