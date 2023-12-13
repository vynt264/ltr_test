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
import { CreateUserInfoDto, UpdateUserInfoDto } from "./dto/index";
import { UserInfo } from "./user.info.entity";
import { UserService } from "../user/user.service";
import { ConnectService } from "../connect/connect.service";
import { OrderRequestService } from "../order.request/order.request.service";
import { UploadS3Service } from "../upload.s3/upload.s3.service";
import { ConfigSys } from "src/common/helper";
@Injectable()
export class UserInfoService { 

  constructor(
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,
    @Inject("winston")
    private readonly logger: Logger,
    private userService: UserService,
    private connectService: ConnectService,
    private orderRequestService: OrderRequestService,
    private uploadS3Service: UploadS3Service,
  ) { }

  async getAll(): Promise<any> {
    try {
      const listData = await this.userInfoRepository.find({});
      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        listData,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getByUserId(userId: number): Promise<any> {
    try {
      let userInfo = await this.userInfoRepository.findOne({
        where: {
          user: {
            id: userId
          }
        }
      });

      const user = await this.userService.getOneById(userId);
      // const listOrderRes = await this.connectService.getOrder(
      //   user.result?.username
      // );
      const listOrderRes = await this.orderRequestService.getAllOrderUserInfo(
        user.result?.username
      );
      if (listOrderRes?.result[0]?.length > 0) {
        let sumBet = 0,
          sumOrder = 0,
          sumOrderWin = 0,
          sumOrderLose = 0,
          favoriteGame = "";
        const listOrder = listOrderRes?.result[0];
        listOrder?.map((order: any) => {
          sumBet += Number(order?.revenue);
          if (order?.status == 9) {
            sumOrderWin += 1; 
          } else if (order?.status == 7) {
            sumOrderLose += 1
          }
          favoriteGame = order?.type + ","
        });
        sumOrder = listOrderRes?.result[1];
        userInfo = {
          ...userInfo,
          sumBet,
          sumOrder,
          sumOrderLose,
          sumOrderWin,
          favoriteGame
        }
        await this.userInfoRepository.save(userInfo);
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        userInfo,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async create(createDto: CreateUserInfoDto): Promise<any> {
    try {
      const createdUser = await this.userInfoRepository.create(createDto);
      const user = await this.userInfoRepository.save(createdUser);
      const { id } = user;
      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        { id },
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async updateNickname(id: number, updateNicknameDto: any): Promise<any> {
    try {
      let foundUserInfo = await this.userInfoRepository.findOneBy({
        id,
      });

      if (!foundUserInfo) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `UserInfo with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (updateNicknameDto) {
        foundUserInfo = {
          ...foundUserInfo,
          nickname: updateNicknameDto?.nickname,
        };
      }

      await this.userInfoRepository.save(foundUserInfo);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }

  async update(id: number, userInfoDto: UpdateUserInfoDto): Promise<any> {
    try {
      let foundUserInfo = await this.userInfoRepository.findOneBy({
        id,
      });

      if (!foundUserInfo) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `UserInfo with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      if (userInfoDto) {
        foundUserInfo = {
          ...foundUserInfo,
          ...userInfoDto,
        };
      }

      await this.userInfoRepository.save(foundUserInfo);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        "",
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUser = await this.userInfoRepository.findOneBy({
        id,
      });

      if (!foundUser) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `UserInfo with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.userInfoRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `UserInfo has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async uploadAvatar(image: Express.Multer.File): Promise<any> {
    try {
      const allowedExtensions = ["image/png", "image/jpg", "image/jpeg"];
      const maxSize = 2 * 1024 * 1024; // 2MB
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
          `Image must be less than 2MB`,
          ERROR.NOT_FOUND
        );
      }

      return await this.uploadS3Service.uploadS3(
        image,
        ConfigSys.config().bucketAvatar
      );
    } catch (error) {
      this.logger.debug(
        `${UserInfoService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
  }
}