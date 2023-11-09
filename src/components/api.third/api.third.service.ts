import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAPIDto, UpdateAPIDto } from "./dto/index";
import { API } from "./api.entity";
import {
  SuccessResponse,
  ErrorResponse,
} from "../../system/BaseResponse/index";
import { STATUSCODE, MESSAGE, ERROR } from "../../system/constants";
import { PaginationQueryDto } from "../../common/common.dto";

@Injectable()
export class APIService {
  constructor(
    @InjectRepository(API)
    private apiRepository: Repository<API>
  ) {}

  private readonly logger = new Logger(APIService.name);

  async getAll(paginationQueryDto: PaginationQueryDto): Promise<any> {
    const { take: perPage, skip: page, order } = paginationQueryDto;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    try {
      const apis = await this.apiRepository.findAndCount({
        order: { id: order },
        take: perPage,
        skip: skip,
      });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        apis,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${APIService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getOneById(id: number): Promise<any> {
    try {
      const api = await this.apiRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        api,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${APIService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async create(apiDto: CreateAPIDto): Promise<any> {
    try {
      const createdAPI = await this.apiRepository.create(apiDto);
      await this.apiRepository.save(createdAPI);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdAPI,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${APIService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, apiDto: UpdateAPIDto): Promise<any> {
    try {
      let foundAPI = await this.apiRepository.findOneBy({
        id,
      });

      if (!foundAPI) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `API with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundAPI = {
        ...foundAPI,
        ...apiDto,
        updatedAt: new Date(),
      };
      await this.apiRepository.save(foundAPI);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundAPI,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${APIService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundAPI = await this.apiRepository.findOneBy({
        id,
      });

      if (!foundAPI) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `API with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.apiRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `API has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${APIService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
