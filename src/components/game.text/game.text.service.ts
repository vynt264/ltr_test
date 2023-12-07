import { Inject, Injectable } from "@nestjs/common";
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
import { CreateGameTextDto, UpdateGameTextDto } from "./dto/index";
import { GameText } from "./game.text.entity";
@Injectable()
export class GameTextService { 

  constructor(
    @InjectRepository(GameText)
    private gameTextRepository: Repository<GameText>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.gameTextRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameTextService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getByChildBetType(childBetType: string): Promise<any> {
    try {
      const data = await this.gameTextRepository.findOneBy({childBetType});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        data,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameTextService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getTutorial(betType: string): Promise<any> {
    try {
      const data = await this.gameTextRepository
        .createQueryBuilder('entity')
        .where('entity.tutorial IS NOT NULL')
        .andWhere('entity.betType = :betType', {betType: betType})
        .getOne();
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        data?.tutorial,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameTextService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateGameTextDto): Promise<any> {
    try {
      const createdGameText = await this.gameTextRepository.create(createDto);
      const GameText = await this.gameTextRepository.save(createdGameText);
      const { id } = GameText;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameTextService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, GameTextDto: UpdateGameTextDto): Promise<any> {
    try {
      let foundGameText = await this.gameTextRepository.findOneBy({
        id,
      });

      if (!foundGameText) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `GameText with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (GameTextDto) {
        foundGameText = {
          ...foundGameText,
          ...GameTextDto,
        };
      }

      await this.gameTextRepository.save(foundGameText);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameTextService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.gameTextRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `GameText with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.gameTextRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `GameText has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameTextService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}