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
import { CreatePromotionDto, UpdatePromotionDto } from "./dto/index";
import { Promotion } from "./promotion.entity";
@Injectable()
export class PromotionService { 

  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.promotionRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreatePromotionDto): Promise<any> {
    try {
      const createdPromotion = await this.promotionRepository.create(createDto);
      const Promotion = await this.promotionRepository.save(createdPromotion);
      const { id } = Promotion;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, PromotionDto: UpdatePromotionDto): Promise<any> {
    try {
      let foundPromotion = await this.promotionRepository.findOneBy({
        id,
      });

      if (!foundPromotion) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Promotion with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (PromotionDto) {
        foundPromotion = {
          ...foundPromotion,
          ...PromotionDto,
        };
      }

      await this.promotionRepository.save(foundPromotion);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.promotionRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Promotion with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.promotionRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Promotion has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${PromotionService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}