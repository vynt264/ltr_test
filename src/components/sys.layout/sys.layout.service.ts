import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { MESSAGE, STATUSCODE } from "../../system/constants";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { SysLayout } from "./sys.layout.entity";

@Injectable()
export class SysLayoutService {
  constructor(
    @InjectRepository(SysLayout)
    private sysLayoutRepository: Repository<SysLayout>,
    @Inject("winston")
    private readonly logger: Logger,
  ) {}

  async getAll(): Promise<any> {
    try {
      const listData = await this.sysLayoutRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysLayoutService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

}
