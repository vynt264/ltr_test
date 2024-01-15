import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, format, startOfDay } from "date-fns";
import * as ExcelJS from "exceljs";
import { Response } from "express";
import { Between, LessThan, Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import { User } from "../../components/user/user.entity";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { ExportMaxLength, writeWorkbook } from "../../system/constants/export";
import { TimeFormat } from "../../system/constants/time";
import { UserRoles } from "../user/enums/user.enum";
import { Device } from "./../device/device.entity";
import { CreateUserHistoryDto, UpdateUserHistoryDto } from "./dto/index";
import { UserHistory } from "./user.history.entity";
@Injectable()
export class UserHistoryService {
  private selectFields = {
    id: true,
    action: true,
    count: true,
    createdAt: true,
    note: true,
    isDeleted: true,
    user: {
      id: true,
      username: true,
    },
  };

  constructor(
    @InjectRepository(UserHistory)
    private userHistoryRepository: Repository<UserHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  async export(
    res: Response<any, Record<string, any>>,
    paginationQueryDto: PaginationQueryDto
  ) {
    const fileName = "User_Histories_" + format(new Date(), "dd-MM-yyyy");
    const objs = await this.getDataExport(paginationQueryDto);
    const workbook = await this.exportToExcel(objs, fileName);
    writeWorkbook(workbook, res, fileName);
  }

  async getDataExport(paginationQuery: PaginationQueryDto) {
    const object: any = JSON.parse(paginationQuery.keyword);
    const { skip: page } = paginationQuery;
    if (page <= 0) {
      return [];
    }

    const count = await this.userHistoryRepository.count({
      relations: ["user"],
      select: { id: true },
      where: this.holdQueryByAdmin(object),
    });

    const searching = await this.userHistoryRepository.find({
      relations: ["user"],
      select: this.selectFields,
      where: this.holdQueryByAdmin(object),
      take:
        count > ExportMaxLength.MAX_LENGTH ? ExportMaxLength.MAX_LENGTH : count,
      skip: 0,
      order: { id: paginationQuery.order },
    });

    return searching;
  }

  async exportToExcel(
    objects: UserHistory[],
    fileName = ""
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(fileName);

    worksheet.addRow(["ID", "Tên hội viên", "Action", "Note", "Ngày tạo"]);
    objects.forEach((obj) => {
      worksheet.addRow([
        obj.id,
        obj.user?.username,
        obj.action,
        obj.note,
        format(obj.createdAt, TimeFormat.dd_mm_yyyy_hh_mm_ss),
      ]);
    });
    return workbook;
  }

  async getAll(paginationQueryDto: PaginationQueryDto): Promise<any> {
    const object: any = JSON.parse(paginationQueryDto.keyword);
    try {
      const userHistory = await this.searchByAdmin(paginationQueryDto, object);

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        userHistory,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchByAdmin(paginationQuery: PaginationQueryDto, object: any) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }

    const skip = +perPage * +page - +perPage;
    const searching = await this.userHistoryRepository.findAndCount({
      relations: ["user"],
      select: this.selectFields,
      where: this.holdQueryByAdmin(object),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  holdQueryByAdmin(object: any = null) {
    const data: any = {};
    data.user = { role: UserRoles.MEMBER };
    for (const key in object) {
      switch (key) {
        case "userId":
          data.user = {
            id: object.userId,
          };
          data.user.id = object.userId;
          break;
        case "username":
          data.user = {
            username: object.username,
          };
          break;
        case "action":
          data.action = object.action;
          break;
        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        const startDate = new Date(object.startDate);
        const endDate = new Date(object.endDate);
        data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
      }
    }
    return data;
  }

  async getOneById(id: number): Promise<any> {
    try {
      const userHistory = await this.userHistoryRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        userHistory,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async create(userHistoryDto: CreateUserHistoryDto): Promise<any> {
    try {
      const { userId: id, mac, ip, ...rest } = userHistoryDto;
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        return new ErrorResponse(
          STATUSCODE.COMMON_FAILED,
          { message: `Not Found userId ${id}` },
          ERROR.CREATE_FAILED
        );
      }
      const foundDevice = await this.getDevice(mac, ip);
      const createdUserHistory = await this.createUserHistory(
        foundDevice,
        null,
        rest,
        user
      );
      await this.userHistoryRepository.save(createdUserHistory);

      return new SuccessResponse(
        STATUSCODE.COMMON_CREATE_SUCCESS,
        createdUserHistory,
        MESSAGE.CREATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.CREATE_FAILED
      );
    }
  }

  async createUserHistory(
    device: Device,
    userHistory: UserHistory,
    rest: any,
    user: User
  ) {
    if (!userHistory) {
      return {
        ...rest,
        user,
        device,
      };
    }

    return {
      ...userHistory,
      ...rest,
      user,
      device,
    };
  }

  async getDevice(mac = "", ip = "") {
    const device = await this.deviceRepository.findOne({
      where: { mac, ip },
    });

    if (!device) {
      const createdDevice = await this.deviceRepository.create({ mac, ip });

      return this.deviceRepository.save(createdDevice);
    }

    return device;
  }

  async update(id: number, userHistoryDto: UpdateUserHistoryDto): Promise<any> {
    try {
      let foundUserHistory = await this.userHistoryRepository.findOneBy({
        id,
      });

      if (!foundUserHistory) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `User-History with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }

      foundUserHistory = {
        ...foundUserHistory,
        ...userHistoryDto,
        updatedAt: new Date(),
      };
      await this.userHistoryRepository.save(foundUserHistory);

      return new SuccessResponse(
        STATUSCODE.COMMON_UPDATE_SUCCESS,
        foundUserHistory,
        MESSAGE.UPDATE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserHistoryService.name} is Logging error: ${JSON.stringify(error)}`
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
      const foundUserHistory = await this.userHistoryRepository.findOneBy({
        id,
      });

      if (!foundUserHistory) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `User-History with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.userHistoryRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `User-History has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${UserHistoryService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }

  async deleteDataAuto() {
    const currentDate = new Date();
    const timeCheck = new Date(currentDate);
    timeCheck.setHours(currentDate.getHours() - 2);
    // delete lotery request
    const data = await this.userHistoryRepository.find({
      where: {
        createdAt: LessThan(timeCheck)
      }
    });
    if (data?.length > 0) {
      data.map(async (item) => {
        await this.userHistoryRepository.delete(item?.id)
      })
    }
  }
}
