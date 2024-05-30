import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { MESSAGE, STATUSCODE } from "../../system/constants";
import { Repository } from "typeorm";
import { Logger } from "winston";
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
}