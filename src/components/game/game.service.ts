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
import { CreateGameDto, UpdateGameDto } from "./dto/index";
import { Game } from "./game.entity";
@Injectable()
export class GameService { 

  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.gameRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateGameDto): Promise<any> {
    try {
      const createdGame = await this.gameRepository.create(createDto);
      const game = await this.gameRepository.save(createdGame);
      const { id } = game;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, gameDto: UpdateGameDto): Promise<any> {
    try {
      let foundGame = await this.gameRepository.findOneBy({
        id,
      });

      if (!foundGame) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Game with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (gameDto) {
        foundGame = {
          ...foundGame,
          ...gameDto,
        };
      }

      await this.gameRepository.save(foundGame);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.gameRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Game with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.gameRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Game has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${GameService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}