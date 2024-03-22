import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, format, startOfDay } from "date-fns";
import { Between, Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { UserRoles } from "../user/enums/user.enum";
import { User } from "../user/user.entity";
import { CreateLotteryAwardDto } from "./dto/index";
import { TypeLottery } from "./enums/status.dto";
import { LotteryAward } from "./lottery.award.entity";
@Injectable()
export class LotteryAwardService {

  private xsmb = 'xsmb';

  constructor(
    @InjectRepository(LotteryAward)
    private lotteryAwardRepository: Repository<LotteryAward>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

  async adminGetAll(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const lotteryAwards = await this.searchAdminGetAll(
        paginationQueryDto,
        object
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        lotteryAwards,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchAdminGetAll(
    paginationQuery: PaginationQueryDto,
    lotteryAwardDto: any,
  ) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.lotteryAwardRepository.findAndCount({
      // select: {
      //   openTime: true,
      //   status: true,
      //   type: true,
      //   awardDetail: true,
      //   awardTitle: true,
      //   turnIndex: true,
      //   id: true,
      // },
      where: this.adminHoldQuery(lotteryAwardDto),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  adminHoldQuery(object: any = null) {
    const data: any = {};
    if (!object) return data;

    for (const key in object) {
      switch (key) {
        case "type":
          data.type = object.type;
          break;
        case "turnIndex":
          data.turnIndex = object.turnIndex;
          break;
        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        let startDate = startOfDay(new Date(object.startDate));
        let endDate = endOfDay(new Date(object.endDate));
        const now = new Date();
        if (startDate.getTime() > now.getTime()) {
          startDate = now;
        }
        if (endDate.getTime() > now.getTime()) {
          endDate = now;
        }
        data.openTime = Between(startDate, endDate);
      }

      if (key === "isTestPlayer") {
        data.isTestPlayer = object.isTestPlayer;
      }
    }

    // let isTestPlayer = false;
    // if (usernameReal) {
    //   isTestPlayer = true;
    // }
    // data.bookmaker = { id: bookMakerId };
    // data.isTestPlayer = isTestPlayer;

    return data;
  }

  async getLotteryAwardByTurn(turnIndex: string, type: string, isTestPlayer: boolean) {
    return this.lotteryAwardRepository.findOne({
      where: {
        turnIndex,
        type,
        isTestPlayer,
      },
    });
  }

  async getAllNotCheckBookmaker(
    paginationQueryDto: PaginationQueryDto,
  ): Promise<any> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);
      const { take: perPage, skip: page } = paginationQueryDto;
      if (page <= 0) {
        return "The skip must be more than 0";
      }
      const skip = +perPage * +page - +perPage;
      const searching = await this.lotteryAwardRepository.findAndCount({
        where: this.guestHoldQueryNoBookmaker(object),
        take: +perPage,
        skip,
        order: { createdAt: paginationQueryDto.order },
      });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        searching,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  guestHoldQueryNoBookmaker(object: any = null) {
    const data: any = { isTestPlayer: object.isTestPlayer };
    if (!object) return data;

    for (const key in object) {
      switch (key) {
        case "type":
          data.type = object.type;
          break;
        case "turnIndex":
          data.turnIndex = object.turnIndex;
          break;
        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        let startDate = startOfDay(new Date(object.startDate));
        let endDate = endOfDay(new Date(object.endDate));
        const now = new Date();
        if (startDate.getTime() > now.getTime()) {
          startDate = now;
        }
        if (endDate.getTime() > now.getTime()) {
          endDate = now;
        }
        data.openTime = Between(startDate, endDate);
      }
    }

    return data;
  }

  async guestGetAll(
    paginationQueryDto: PaginationQueryDto,
    member: any
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const lotteryAwards = await this.searchGuestGetAll(
        paginationQueryDto,
        object,
        member.bookmakerId,
        member.usernameReal,
        member.id,
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        lotteryAwards,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async getLottery(type: string): Promise<BaseResponse> {
    try {
      let nextTime = null;
      let nextTurnIndex = null;
      const lottery = await this.lotteryAwardRepository.findOne({
        select: {
          // openTime: true,
          awardDetail: true,
          type: true,
          // awardTitle: true,
          turnIndex: true,
          id: true,
        },
        where: {
          type: type
        },
        order: {
          id: "DESC"
        }
      });

      if (type == `${TypeLottery.XSMB}`) {
        const { nextTime: nextTimeXsmb, nextTurnIndex: nextTurnIndexXsmb } = this.getNextTimeXsmb(lottery);
        nextTime = nextTimeXsmb;
        nextTurnIndex = nextTurnIndexXsmb;
      } else if (type != `${TypeLottery.XSN_TEST}` && type != `${TypeLottery.XSN_45s}`) {
        let second;
        switch (type) {
          case `${TypeLottery.XSMB_45_S}`:
          case `${TypeLottery.XSMT_45_S}`:
          case `${TypeLottery.XSMN_45_S}`:
          case `${TypeLottery.XSSPL_45_S}`: second = 45000; break;
          case `${TypeLottery.XSMB_180_S}`:
          case `${TypeLottery.XSMT_180_S}`:
          case `${TypeLottery.XSMN_180_S}`: second = 180000; break;
          case `${TypeLottery.XSSPL_60_S}`: second = 60000; break;
          case `${TypeLottery.XSSPL_90_S}`: second = 90000; break;
          case `${TypeLottery.XSSPL_120_S}`: second = 120000; break;
          case `${TypeLottery.XSSPL_360_S}`: second = 360000; break;
          default: second = 1000; break;
        }
        const currentTurn = Number(lottery?.turnIndex.substring(11));
        const { nextTime: nextTimeBySecond, nextTurnIndex: nextTurnIndexBySecond } = this.getNextTimeXsBySecond(second, currentTurn);
        nextTime = nextTimeBySecond;
        nextTurnIndex = nextTurnIndexBySecond;
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        { lottery, nextTime, nextTurnIndex },
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  getLotteryAwardByTurnIndex(turnIndex: string, type: string, isTestPlayer: boolean) {
    return this.lotteryAwardRepository.findOne({
      where: {
        type,
        turnIndex,
        isTestPlayer,
      },
    });
  }

  getNextTimeXsBySecond(second: number, currentTurn: number = 0) {
    const cycle = second;
    const now = new Date(new Date().getTime() - 5000);
    const nextTurn = currentTurn + 1;
    const nextTime = new Date(startOfDay(now).getTime() + cycle * nextTurn);
    const nextTurnIndex = format(nextTime, 'dd/MM/yyyy') + '-' + nextTurn;
    return { nextTime, nextTurnIndex };
  }

  getNextTimeXsmb(xsmb: LotteryAward) {
    const now = new Date();
    let nextTime = null;
    const formattedDate = format(now, 'dd/MM/yyyy');
    if (xsmb && startOfDay(new Date(xsmb.openTime).getTime()) == startOfDay(now.getTime())) {
      // next day
      const time0h = startOfDay(now).getTime();
      const nextDayTime6h15 = (18 * 60 + 30 + 24 * 60) * 60000;
      nextTime = new Date(time0h + nextDayTime6h15);
    } else {
      const time0h = startOfDay(now).getTime();
      const time6h15 = (18 * 60 + 30) * 60000;
      nextTime = new Date(time0h + time6h15);
    }
    const nextTurnIndex = format(nextTime, 'dd/MM/yyyy');
    return { nextTime, nextTurnIndex };
  }

  getNextTime() {
  }

  async userGetAll(
    paginationQueryDto: PaginationQueryDto,
    member: any
  ): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const lotteryAwards = await this.searchUserGetAll(
        paginationQueryDto,
        object,
        member.bookmakerId,
        member.usernameReal,
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        lotteryAwards,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async searchGuestGetAll(
    paginationQuery: PaginationQueryDto,
    lotteryAwardDto: any,
    bookMakerId: number,
    usernameReal: string,
    userId: number,
  ) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.lotteryAwardRepository.findAndCount({
      // select: {
      //   openTime: true,
      //   status: true,
      //   type: true,
      //   awardDetail: true,
      //   awardTitle: true,
      //   turnIndex: true,
      //   id: true,
      // },
      where: this.guestHoldQuery(
        lotteryAwardDto,
        bookMakerId,
        usernameReal,
        userId
      ),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  async searchUserGetAll(
    paginationQuery: PaginationQueryDto,
    lotteryAwardDto: any,
    bookMakerId: number,
    usernameReal: string,
  ) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.lotteryAwardRepository.findAndCount({
      select: {
        // openTime: true,
        // status: true,
        type: true,
        awardDetail: true,
        // awardTitle: true,
        turnIndex: true,
        // partnerCode: true,
        createdAt: true,
        // rateWin: true,
        // totalPay: true,
        // totalRevenue: true,
      },
      where: this.guestHoldQuery(lotteryAwardDto, bookMakerId, usernameReal),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  guestHoldQuery(
    object: any = null,
    bookMakerId: number,
    usernameReal: string,
    userId = 0,
  ) {
    const data: any = {};
    if (!object) return data;

    for (const key in object) {
      switch (key) {
        case "type":
          data.type = object.type;
          break;
        case "turnIndex":
          data.turnIndex = object.turnIndex;
          break;
        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        let startDate = startOfDay(new Date(object.startDate));
        let endDate = endOfDay(new Date(object.endDate));
        const now = new Date();
        if (startDate.getTime() > now.getTime()) {
          startDate = now;
        } if (endDate.getTime() > now.getTime()) {
          endDate = now;
        }
        data.openTime = Between(startDate, endDate);
      }
    }

    let isTestPlayer = false;
    if (usernameReal) {
      isTestPlayer = true;
    }
    data.bookmaker = { id: bookMakerId };
    data.isTestPlayer = isTestPlayer;
    if (object.type.indexOf("1s") > -1) {
      data.userId = userId
    }

    return data;
  }

  async getRoleById(id: number): Promise<any> {
    const member = await this.userRepository.findOne({
      select: {
        id: true,
        isBlocked: true,
      },
      where: {
        id,
        role: UserRoles.MEMBER,
        isBlocked: false,
      },
    });
    if (!member) {
      return {
        error: new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
      };
    }

    return { member };
  }

  async findOneBy(type: string, turnIndex: string, bookMakerId: number, isTestPlayer: boolean): Promise<LotteryAward> {
    return this.lotteryAwardRepository.findOneBy({
      type,
      turnIndex,
      isTestPlayer,
      bookmaker: { id: bookMakerId },
    });
  }

  async getOneById(id: number): Promise<BaseResponse> {
    try {
      const foundlotteryAward = await this.lotteryAwardRepository.findOneBy({ id });

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        foundlotteryAward,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_NOT_FOUND,
        error,
        ERROR.NOT_FOUND
      );
    }
  }

  async verifyUser(id: any): Promise<{ error: ErrorResponse; user: User }> {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
      },
      where: {
        id,
      },
    });
    if (!user) {
      return {
        error: new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          { message: `Not found userId ${id}` },
          ERROR.USER_NOT_FOUND
        ),
        user: null,
      };
    }

    return { error: null, user };
  }

  convertOpenTime(type: string, dateTime: Date): Date {
    if (type == this.xsmb) {
      const time0h = startOfDay(dateTime).getTime();
      const time6h30 = (18 * 60 + 30) * 60000;
      return new Date(time0h + time6h30);
    }
    return dateTime;
  }

  convertDetail(data: string = '', typeLotrery = '') {
    if (!data && data.length == 0) {
      return [];
    }
    const arrAwardStr = data.split('-');
    if (arrAwardStr.length == 0) {
      return [];
    }
    const arr = [];
    if (typeLotrery == this.xsmb) {
      for (let i = 0; i < 7; i++) {
        arr.push('');
      }
      arr[0] = arrAwardStr[0];

      arr[1] = arrAwardStr[1];

      arr[2] = arrAwardStr[2]
        + ',' + arrAwardStr[3];

      arr[3] = arrAwardStr[4]
        + ',' + arrAwardStr[5]
        + ',' + arrAwardStr[6]
        + ',' + arrAwardStr[7]
        + ',' + arrAwardStr[8]
        + ',' + arrAwardStr[9];

      arr[4] = arrAwardStr[10]
        + ',' + arrAwardStr[11]
        + ',' + arrAwardStr[12]
        + ',' + arrAwardStr[13];

      arr[5] = arrAwardStr[14]
        + ',' + arrAwardStr[15]
        + ',' + arrAwardStr[16]
        + ',' + arrAwardStr[17]
        + ',' + arrAwardStr[18]
        + ',' + arrAwardStr[19];

      arr[6] = arrAwardStr[20]
        + ',' + arrAwardStr[21]
        + ',' + arrAwardStr[22];

      arr[7] = arrAwardStr[23]
        + ',' + arrAwardStr[24]
        + ',' + arrAwardStr[25]
        + ',' + arrAwardStr[26];
      return arr;
    }

    return arrAwardStr;
  }

  getTurnIndex(type: string): string {
    const now = new Date(new Date().getTime() - 5000);
    const formattedDate = format(now, "dd/MM/yyyy");
    let turnIndex = "";
    if (type == `${TypeLottery.XSMB}`) {
      turnIndex = formattedDate;
    } else if (
      type == `${TypeLottery.XSMB_45_S}` || type == `${TypeLottery.XSMT_45_S}` ||
      type == `${TypeLottery.XSMN_45_S}` || type == `${TypeLottery.XSSPL_45_S}`
    ) {
      const cycle = 45000;
      const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
      const turn = Math.floor(minutesSinceMidnight / +cycle);
      turnIndex = formattedDate + "-" + turn;
    } else if (type == `${TypeLottery.XSN_TEST}`) {
      turnIndex = formattedDate + "-" + now.getTime();
    } else if (type == `${TypeLottery.XSN_TEST}`) {
      turnIndex =
        formattedDate + "-" + now.getTime() + "-" + this.genRandom(0, 9999);
    } else if (
      type == `${TypeLottery.XSMB_180_S}` || type == `${TypeLottery.XSMT_180_S}` ||
      type == `${TypeLottery.XSMN_180_S}`
    ) {
      const cycle = 180000;
      const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
      const turn = Math.floor(minutesSinceMidnight / +cycle);
      turnIndex = formattedDate + "-" + turn;
    } else if (type == `${TypeLottery.XSSPL_60_S}`) {
      const cycle = 60000;
      const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
      const turn = Math.floor(minutesSinceMidnight / +cycle);
      turnIndex = formattedDate + "-" + turn;
    } else if (type == `${TypeLottery.XSSPL_90_S}`) {
      const cycle = 90000;
      const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
      const turn = Math.floor(minutesSinceMidnight / +cycle);
      turnIndex = formattedDate + "-" + turn;
    } else if (type == `${TypeLottery.XSSPL_120_S}`) {
      const cycle = 120000;
      const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
      const turn = Math.floor(minutesSinceMidnight / +cycle);
      turnIndex = formattedDate + "-" + turn;
    } else if (type == `${TypeLottery.XSSPL_360_S}`) {
      const cycle = 360000;
      const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
      const turn = Math.floor(minutesSinceMidnight / +cycle);
      turnIndex = formattedDate + "-" + turn;
    }

    return turnIndex;
  }

  genRandom(min: number, max: number): number {
    const randomDecimal = Math.random();
    const randomNumber = Math.floor(randomDecimal * (max - min + 1)) + min;
    return randomNumber;
  }

  getOpenTime(type: string): Date {
    if (type == `${TypeLottery.XSN_TEST}`) {
      return new Date();
    }

    if (
      type == `${TypeLottery.XSMB_45_S}` || type == `${TypeLottery.XSMT_45_S}` ||
      type == `${TypeLottery.XSMN_45_S}` || type == `${TypeLottery.XSSPL_45_S}`
    ) {
      return this.getTimeBySecond(45000);
    }

    if (
      type == `${TypeLottery.XSMB_180_S}` || type == `${TypeLottery.XSMT_180_S}` ||
      type == `${TypeLottery.XSMN_180_S}`
    ) {
      return this.getTimeBySecond(180000);
    }

    if (type == `${TypeLottery.XSSPL_60_S}`) {
      return this.getTimeBySecond(60000);
    }

    if (type == `${TypeLottery.XSSPL_90_S}`) {
      return this.getTimeBySecond(90000);
    }

    if (type == `${TypeLottery.XSSPL_120_S}`) {
      return this.getTimeBySecond(120000);
    }

    if (type == `${TypeLottery.XSSPL_360_S}`) {
      return this.getTimeBySecond(360000);
    }

    return new Date();
  }

  getTimeBySecond(second: number) {
    const cycle = second;
    const now = new Date();
    const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
    const nextTurn = Math.floor(minutesSinceMidnight / +cycle);

    return new Date(startOfDay(now).getTime() + cycle * nextTurn);
  }

  initArrAwardStr(arrAward: number[]) {
    const arrAwardStr = [];
    for (let i = 0; i < arrAward.length; i++) {
      if (i == 0) {
        arrAwardStr.push(this.initRandomStr(100000, 1000000, arrAward[i]));
      } else if (i <= 2) {
        arrAwardStr.push(this.initRandomStr(10000, 100000, arrAward[i]));
      } else if (i <= 11) {
        arrAwardStr.push(this.initRandomStr(10000, 100000, arrAward[i]));
      } else if (i <= 15) {
        arrAwardStr.push(this.initRandomStr(1000, 10000, arrAward[i]));
      } else if (i <= 16) {
        arrAwardStr.push(this.initRandomStr(100, 1000, arrAward[i]));
      } else if (i == 17) {
        arrAwardStr.push(this.initRandomStr(10, 100, arrAward[i]));
      }
    }
    return arrAwardStr;
  }

  initRandomStr(min: number, max: number, endValue: number) {
    const randomValue = this.genRandom(min, max - 1);
    let valueStr = randomValue + "";
    let endStr = endValue + "";
    if (endValue < 10) endStr = "0" + endValue;
    if (randomValue > 100) {
      const random0 = this.genRandom(0, 15);
      if (random0 <= 1) {
        return "0" + valueStr.slice(1, valueStr.length - 2) + "" + endStr;
      }
    }
    return valueStr.slice(0, valueStr.length - 2) + "" + endStr;
  }

  initValue(length: number, endValue: number) {
    const randomLeng = this.genRandom(
      Math.pow(10, length),
      Math.pow(10, length + 1) - 1
    );
    let valueStr = randomLeng + "";
    return valueStr.slice(0, valueStr.length - 2) + "" + endValue;
  }

  getStrLength2(value: number) {
    if (!value || value < 0) return `${this.genRandom(10, 99)}`;
    if (value < 10) return `0${value}`;
    if (value < 100) return `${value}`;
    return value.toString().slice(0, 2);
  }

  getStrLength3(value: number) {
    if (!value || value < 100) return `0${this.getStrLength2(value)}`;
    if (value < 1000) return `${value}`;
    return value.toString().slice(0, 3);
  }

  getStrLength4(value: number) {
    if (!value || value < 1000) return `0${this.getStrLength3(value)}`;
    if (value < 10000) return `${value}`;
    return value.toString().slice(0, 4);
  }

  endsWithElement(arr: Array<number>, number: number) {
    for (const element of arr) {
      if (number.toString().endsWith(element.toString())) {
        return true;
      }
    }
    return false;
  }

  async createLotteryAward(createAwardDto: CreateLotteryAwardDto) {
    return await this.lotteryAwardRepository.save(createAwardDto);
  }

  async delete(id: number): Promise<BaseResponse> {
    try {
      const foundlotteryAward = await this.lotteryAwardRepository.findOneBy({
        id,
      });

      if (!foundlotteryAward) {
        return new ErrorResponse(
          STATUSCODE.COMMON_NOT_FOUND,
          `lotteryAward with id: ${id} not found!`,
          ERROR.NOT_FOUND
        );
      }
      await this.lotteryAwardRepository.delete(id);

      return new SuccessResponse(
        STATUSCODE.COMMON_DELETE_SUCCESS,
        `lotteryAward has deleted id: ${id} success!`,
        MESSAGE.DELETE_SUCCESS
      );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.DELETE_FAILED
      );
    }
  }
}

