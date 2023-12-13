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
import { CreateSysLayoutDto, UpdateSysLayoutDto } from "./dto/index";
import { SysLayout } from "./sys.layout.entity";
import { User } from "../user/user.entity";
import { UploadS3Service } from "../upload.s3/upload.s3.service";
import { ConfigSys } from "src/common/helper";
@Injectable()
export class SysLayoutService {
  constructor(
    @InjectRepository(SysLayout)
    private sysLayoutRepository: Repository<SysLayout>,
    @Inject("winston")
    private readonly logger: Logger,
    private uploadS3Service: UploadS3Service,
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

  async create(createDto: CreateSysLayoutDto, user: User): Promise<any> {
    try {
      const newSysLayout = {
        ...createDto,
        createdBy: user.name,
        createdAt: new Date(),
      };
      const createdSysLayout = await this.sysLayoutRepository.create(
        newSysLayout
      );
      const sysLayout = await this.sysLayoutRepository.save(createdSysLayout);
      const { id } = sysLayout;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysLayoutService.name} is Logging error: ${JSON.stringify(error)}`
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
    SysLayoutDto: UpdateSysLayoutDto,
    user: User
  ): Promise<any> {
    try {
      let foundSysLayout = await this.sysLayoutRepository.findOneBy({
        id,
      });

      if (!foundSysLayout) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `SysLayout with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (SysLayoutDto) {
        foundSysLayout = {
          ...foundSysLayout,
          ...SysLayoutDto,
          updatedBy: user.name,
          updatedAt: new Date(),
        };
      }

      await this.sysLayoutRepository.save(foundSysLayout);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysLayoutService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.sysLayoutRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `SysLayout with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.sysLayoutRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `SysLayout has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${SysLayoutService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async uploadImage(image: Express.Multer.File): Promise<any> {
    try {
      const allowedExtensions = ["image/png", "image/jpg", "image/jpeg"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const mimeType = image?.mimetype;

      if (!allowedExtensions.includes(mimeType)) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Image must be support png, jpg, jpeg`,
          ERROR.NOT_FOUND
        );
      }

      if (image?.size > maxSize) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Image must be less than 5MB`,
          ERROR.NOT_FOUND
        );
      }

      return await this.uploadS3Service.uploadS3(
        image,
        ConfigSys.config().bucketSysLayout
      );
    } catch (error) {
      this.logger.debug(
        `${SysLayoutService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }
}
