import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateDeviceDto, UpdateDeviceDto } from "./dto/index";
import { Device } from "./device.entity";
import {
  SuccessResponse,
  ErrorResponse,
} from "../../system/BaseResponse/index";
import { STATUSCODE, MESSAGE, ERROR } from "../../system/constants";
import { PaginationQueryDto } from "../../common/common.dto";
import { Logger } from "winston";

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async getAll(paginationQueryDto: PaginationQueryDto): Promise<any> {
    const { take, skip, order } = paginationQueryDto;
    try {
      const devices = await this.deviceRepository.findAndCount({
        order: { id: order },
        take: take,
        skip: skip,
      });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        devices,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${DeviceService.name} is Logging error: ${JSON.stringify(error)}`
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
      const device = await this.deviceRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        device,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${DeviceService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async create(deviceDto: CreateDeviceDto): Promise<any> {
    try {
      const createdDevice = await this.deviceRepository.create(deviceDto);
      await this.deviceRepository.save(createdDevice);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdDevice,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${DeviceService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async update(id: number, deviceDto: UpdateDeviceDto): Promise<any> {
    try {
      let foundDevice = await this.deviceRepository.findOneBy({
        id,
      });

      if (!foundDevice) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Device with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundDevice = {
        ...foundDevice,
        ...deviceDto,
        updatedAt: new Date(),
      };
      await this.deviceRepository.save(foundDevice);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundDevice,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${DeviceService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundDevice = await this.deviceRepository.findOneBy({
        id,
      });

      if (!foundDevice) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `Device with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.deviceRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `Device has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${DeviceService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}
