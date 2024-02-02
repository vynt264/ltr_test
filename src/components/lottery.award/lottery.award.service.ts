import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, format, startOfDay } from "date-fns";
import { Between, LessThan, Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
import { ConnectService } from "../connect/connect.service";
import { OrderRequest } from "../order.request/order.request.entity";
import { OrderRequestService } from "../order.request/order.request.service";
import { SystemEnum } from "../sys.config/enums/sys.config.enum";
import { UserRoles } from "../user/enums/user.enum";
import { User } from "../user/user.entity";
import { CreateLotteryAwardDto, UpdateLotteryAwardDto } from "./dto/index";
import { CharLottery, CurrentXsmb, StatusLotteryAward, TypeLottery } from "./enums/status.dto";
import { LotteryAward } from "./lottery.award.entity";
import { RequestDetailDto } from "../lottery.request/dto/request.detail.dto";
import { ValueDto } from "../lottery.request/dto/request.value.dto";
import { TypeCaculation, RateCaculation, LotteryInfo, MatricInt, MatricGiai } from "../lottery.request/enums/status.dto";
import { BaoLoDto } from "../lottery.request/dto/bao.lo.dto";
import { DanhDeDto } from "../lottery.request/dto/danh.de.dto";
import { StatusOrderRequest } from "../order.request/enums/status.dto";
import { LotteryRequest } from "../lottery.request/lottery.request.entity";
import { RequestDetailDto as LotteryRequestDetailDto } from "../lottery.request/dto/request.detail.dto";
import { PrefixEnum, StatusSend } from "../sys.config/enums/sys.config.enum";
import { LotteryFtQueue } from "../lottery.request/lottery.ft.queue";
import { SubAwardDto } from "../lottery.request/dto/sub.award.dto";
import { BaseGiaiDto } from "../lottery.request/dto/base2so.dto";
@Injectable()
export class LotteryAwardService {

  private xsmb = 'xsmb';
  private loop3And4Length = 10;
  private loopPrefix = 100;

  constructor(
    @InjectRepository(LotteryAward)
    private lotteryAwardRepository: Repository<LotteryAward>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private connectService: ConnectService,
    private orderRequestService: OrderRequestService,
    @InjectRepository(LotteryRequest)
    private lotteryRequestRepository: Repository<LotteryRequest>,
    @InjectRepository(LotteryFtQueue)
    private lotteryFtRepository: Repository<LotteryFtQueue>,
    @Inject("winston")
    private readonly logger: Logger
  ) { }

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
    const data: any = { isTestPlayer: 0 };
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

  // async getAllType(): Promise<BaseResponse> {
  //   try {
  //     const lotteryAwards: any = [];
  //     const listType = [
  //       // TypeLottery.XSMB_1_S,
  //       TypeLottery.XSMB_45_S,
  //       TypeLottery.XSMB_180_S,
  //       // TypeLottery.XSMT_1_S,
  //       TypeLottery.XSMT_45_S,
  //       TypeLottery.XSMT_180_S,
  //       // TypeLottery.XSMN_1_S,
  //       TypeLottery.XSMN_45_S,
  //       TypeLottery.XSMN_180_S,
  //       // TypeLottery.XSSPL_1_S,
  //       TypeLottery.XSSPL_45_S,
  //       TypeLottery.XSSPL_60_S,
  //       TypeLottery.XSSPL_90_S,
  //       TypeLottery.XSSPL_120_S,
  //       TypeLottery.XSSPL_360_S,
  //     ]
  //     const all = listType.map(async (type: string) => {
  //       const dataRes = await this.getLottery(type);
  //       const data = dataRes?.result;
  //       lotteryAwards.push(data)
  //     });
  //     await Promise.all(all);

  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_SUCCESS,
  //       lotteryAwards,
  //       MESSAGE.LIST_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       MESSAGE.LIST_FAILED
  //     );
  //   }
  // }

  // async getCurentXsmb(
  // ): Promise<BaseResponse> {
  //   try {
  //     const xsmbAward = await this.lotteryAwardRepository.findOne({
  //       select: {
  //         openTime: true,
  //         awardDetail: true,
  //         type: true,
  //         awardTitle: true,
  //         turnIndex: true,
  //       },
  //       where: {
  //         type: `${TypeLottery.XSMB}`
  //       },
  //       order: {
  //         id: "DESC"
  //       }
  //     });
  //     const { nextTime, nextTurnIndex } = this.getNextTimeXsmb(xsmbAward);

  //     const xsmb = { award: xsmbAward, nextTime, nextTurnIndex };

  //     const xsmb45sAward = await this.lotteryAwardRepository.findOne({
  //       select: {
  //         openTime: true,
  //         awardDetail: true,
  //         type: true,
  //         awardTitle: true,
  //         turnIndex: true,
  //       },
  //       where: {
  //         type: `${TypeLottery.XSMB_45_S}`
  //       },
  //       order: {
  //         id: "DESC"
  //       }
  //     });

  //     const { nextTime: nextTime45s, nextTurnIndex: nextTurnIndex45s } = this.getNextTimeXsBySecond(45000);
  //     const xsmb45s = { award: xsmb45sAward, nextTime: nextTime45s, nextTurnIndex: nextTurnIndex45s };
  //     const result: CurrentXsmb = {
  //       xsmb,
  //       xsmb45s
  //     }
  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_SUCCESS,
  //       result,
  //       MESSAGE.LIST_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       MESSAGE.LIST_FAILED
  //     );
  //   }
  // }

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

  async findOneBy(type: string, turnIndex: string, bookMakerId: number): Promise<LotteryAward> {
    return this.lotteryAwardRepository.findOneBy({
      type,
      turnIndex,
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

  // async processJobGetXsmb(fromDate: Date, toDate: Date, typeLotrery: string, isAuto: boolean = false) {
  //   const body = await this.connectService.getDataLottery(typeLotrery, fromDate, toDate);
  //   if (body && body instanceof Array && body.length > 0) {
  //     for (let i = 0; i < body.length; i++) {
  //       try {
  //         const data = body[i];
  //         const award = this.lotteryAwardRepository.create({});
  //         const formatYYYMMDD = data?.ngay + '';
  //         award.turnIndex = `${formatYYYMMDD.slice(8, 10)}/${formatYYYMMDD.slice(5, 7)}/${formatYYYMMDD.slice(0, 4)}`;
  //         award.type = typeLotrery;
  //         const arrAward = this.convertDetail(data?.ket_qua, typeLotrery);

  //         if (arrAward.length == 0) {
  //           return;
  //         }

  //         award.awardDetail = JSON.stringify(arrAward);
  //         award.awardTitle = arrAward[0];
  //         award.openTime = this.convertOpenTime(typeLotrery, new Date(data.ngay));
  //         await this.lotteryAwardRepository.save(award);
  //       } catch (error) {
  //         this.logger.debug(
  //           `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
  //         );
  //       }
  //     }
  //   } else {
  //     // await 10s
  //     if (isAuto) {
  //       await this.processJobGetXsmb(fromDate, toDate, typeLotrery);
  //     }
  //   }
  // }

  // async processXsByType(type: string) {
  //   const turnIndex = this.getTurnIndex(type);
  //   const username = `${SystemEnum.SYSTEM}`;

  //   const createLotteryAward: CreateLotteryAwardDto = {
  //     type,
  //     turnIndex,
  //   }

  //   const result = await this.create(createLotteryAward, username);
  // }

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

  // async processInitLotteryAward(createRequestDto: LotteryRequestDetailDto): Promise<BaseResponse> {
  //   try {
  //     createRequestDto.type = createRequestDto.type
  //       ? createRequestDto.type
  //       : `${TypeLottery.XSN_TEST}`;
  //     let ft = "";
  //     createRequestDto.turnIndex = this.getTurnIndex(createRequestDto.type);
  //     let lotteryRequest = null;
  //     const newLotteryRequest = {
  //       detail: { ...createRequestDto },
  //       status: `${StatusSend.INIT}`,
  //     };

  //     const createdLotteryRequest =
  //       this.lotteryRequestRepository.create(newLotteryRequest);
  //     const ftQueue = await this.lotteryFtRepository.save({});
  //     createdLotteryRequest.type = createRequestDto.type;
  //     const lotteryFound = await this.lotteryRequestRepository.findOneBy({
  //       type: createRequestDto.type,
  //       turnIndex: createRequestDto.turnIndex,
  //     });

  //     if (lotteryFound) {
  //       return new ErrorResponse(
  //         STATUSCODE.REQUEST_DUPLICATE,
  //         "request duplicated",
  //         ERROR.CREATE_FAILED
  //       );
  //     }

  //     ft = PrefixEnum.LOTTTERY_REQUEST + ftQueue.id;
  //     createdLotteryRequest.turnIndex = createRequestDto.turnIndex;
  //     lotteryRequest = await this.lotteryRequestRepository.save(
  //       createdLotteryRequest
  //     );

  //     const lotteryAward = await this.processInitAward(
  //       createRequestDto,
  //       lotteryRequest
  //     );
  //     // TODO remove log
  //     if (lotteryAward.totalPay > 0) {
  //       console.log(lotteryAward);
  //     }

  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_CREATE_SUCCESS,
  //       lotteryAward,
  //       MESSAGE.CREATE_SUCCESS
  //     );
  //   } catch (error) {
  //     console.log(error);
  //     this.logger.debug(
  //       `${LotteryAwardService.name} is Logging error: ${JSON.stringify(
  //         error
  //       )}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       ERROR.CREATE_FAILED
  //     );
  //   }
  // }

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

  // async processInitAward(
  //   createRequestDto: LotteryRequestDetailDto,
  //   lotteryRequest: LotteryRequest
  // ) {
  //   let lotteryAward = null;

  //   try {
  //     const lotteryInfo: LotteryInfo = {
  //       mapMatricInt: null,
  //       matricMore2SoOther: [],
  //       arrAwardInt: [],
  //       arrAwardStr: [],
  //       maxlength2so: 100,
  //       minWinNhaCai: 0,
  //       rateDeWin: 0.2,
  //       rootTotalRevenue: 0,
  //       totalRevenue: 0,
  //       totalPayment: 0,
  //     };

  //     let totalRevenue = this.getTotalRevenue(createRequestDto, lotteryInfo);
  //     lotteryInfo.rootTotalRevenue = totalRevenue;
  //     lotteryInfo.minWinNhaCai = totalRevenue * 0.95;

  //     const { arrAwardInt, totalPay, arrAwardStr } = this.getArrAwardInt(
  //       createRequestDto,
  //       lotteryInfo
  //     );
  //     if (lotteryInfo.rootTotalRevenue != 0) {
  //     }

  //     lotteryAward = this.lotteryAwardRepository.create({});
  //     lotteryAward.totalRevenue = +lotteryInfo.rootTotalRevenue;
  //     lotteryAward.awardTitle = arrAwardStr[0];
  //     lotteryAward.totalPay = totalPay;

  //     if (lotteryAward.totalRevenue != 0 && lotteryAward.totalPay != 0) {
  //       lotteryAward.rateWin =
  //         1 -
  //         (1.0 * +lotteryAward.totalPay) / (1.0 * +lotteryAward.totalRevenue);
  //     }

  //     const detail1to8 = this.getDetail1to8(arrAwardStr);
  //     lotteryAward.awardDetail = JSON.stringify(detail1to8);
  //     lotteryAward.type = createRequestDto.type;
  //     lotteryAward.turnIndex = createRequestDto.turnIndex;
  //     lotteryAward.openTime = this.getOpenTime(lotteryAward.type);

  //     await this.lotteryAwardRepository.save(lotteryAward);

  //     if (lotteryRequest.status != `${StatusSend.AUTO}`) {
  //       lotteryRequest.lotteryAwardId = lotteryAward.id;
  //       lotteryRequest.status = `${StatusSend.SUCCESS}`;
  //       await this.lotteryRequestRepository.save(lotteryRequest);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     if (lotteryRequest.status != `${StatusSend.AUTO}`) {
  //       lotteryRequest.status = `${StatusSend.ERROR}`;
  //       const errorMessage = JSON.stringify(error);
  //       lotteryRequest.errorReason =
  //         errorMessage.length > 255 ? errorMessage.slice(0, 255) : errorMessage;
  //       await this.lotteryRequestRepository.save(lotteryRequest);
  //     }
  //   }

  //   return lotteryAward;
  // }

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

  getTotalRevenue(
    createRequestDto: LotteryRequestDetailDto,
    lotteryInfo: LotteryInfo
  ) {
    let mapMatricInt = new Map<number, MatricInt>();
    for (let i = 0; i < 10000; i++) {
      if (i < 100) {
        let matricInt: MatricInt = {
          value: i,
          giai8Pay: 0,
          giai0Pay: 0,
          giaiLoPay: 0,
          giai0Revenue: 0,
          giai8Revenue: 0,
          giaiLoRevenue: 0,
        };
        mapMatricInt.set(i, matricInt);
      }
    }

    lotteryInfo.mapMatricInt = mapMatricInt;
    let totalRevenue = 0;

    if (createRequestDto.danhDe) {
      if (createRequestDto.danhDe.deDacBiet?.length > 0) {
        for (const valueDto of createRequestDto.danhDe.deDacBiet) {
          let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
          valueMap.giai0Pay += valueDto.amount * +RateCaculation.De_Dac_Biet;
          valueMap.giai0Revenue += valueDto.amount;

          totalRevenue += valueDto.amount;
          lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
        }
      }

      if (createRequestDto.danhDe.deDau?.length > 0) {
        for (const valueDto of createRequestDto.danhDe.deDau) {
          let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
          valueMap.giai8Pay += valueDto.amount * +RateCaculation.De_Dau;
          valueMap.giai8Revenue += valueDto.amount;

          totalRevenue += valueDto.amount;
          lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
        }
      }

      if (createRequestDto.danhDe.deDauDuoi?.length > 0) {
        for (const valueDto of createRequestDto.danhDe.deDauDuoi) {
          let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
          valueMap.giai0Pay += valueDto.amount * +RateCaculation.De_Dau_Duoi;
          valueMap.giai8Pay += valueDto.amount * +RateCaculation.De_Dau_Duoi;

          valueMap.giai0Revenue += valueDto.amount;
          valueMap.giai8Revenue += valueDto.amount;

          totalRevenue += valueDto.amount;
          lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
        }
      }
    }

    if (createRequestDto.baoLo) {
      if (createRequestDto.baoLo?.lo2So?.length > 0) {
        for (const valueDto of createRequestDto.baoLo.lo2So) {
          let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
          valueMap.giaiLoPay += valueDto.amount * +RateCaculation.Lo_2_So;
          valueMap.giaiLoRevenue += valueDto.amount;

          valueMap.giai0Pay += valueDto.amount * +RateCaculation.Lo_2_So;
          valueMap.giai0Revenue += valueDto.amount;

          valueMap.giai8Pay += valueDto.amount * +RateCaculation.Lo_2_So;
          valueMap.giai8Revenue += valueDto.amount;

          totalRevenue += valueDto.amount;
          lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
        }
      }

      if (createRequestDto.baoLo?.lo2So1k?.length > 0) {
        for (const valueDto of createRequestDto.baoLo.lo2So1k) {
          let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
          valueMap.giaiLoPay += valueDto.amount * +RateCaculation.Lo_2_So_1k;
          valueMap.giaiLoRevenue += valueDto.amount;

          valueMap.giai0Pay += valueDto.amount * +RateCaculation.Lo_2_So_1k;
          valueMap.giai0Revenue += valueDto.amount;

          valueMap.giai8Pay += valueDto.amount * +RateCaculation.Lo_2_So_1k;
          valueMap.giai8Revenue += valueDto.amount;
          totalRevenue += valueDto.amount;
          lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
        }
      }

      if (createRequestDto.baoLo?.lo3So?.length > 0) {
        for (const valueDto of createRequestDto.baoLo.lo3So) {
          totalRevenue += valueDto.amount;
        }
      }

      if (createRequestDto.baoLo?.lo4So?.length > 0) {
        for (const valueDto of createRequestDto.baoLo.lo4So) {
          totalRevenue += valueDto.amount;
        }
      }
    }


    return totalRevenue;
  }

  getDetail1to8(arrAwardStr: string[]) {
    const arr = [];
    for (let i = 0; i < 9; i++) {
      arr.push("");
    }
    arr[0] = arrAwardStr[0];
    arr[1] = arrAwardStr[1];
    arr[2] = arrAwardStr[2];
    arr[3] = arrAwardStr[3] + "," + arrAwardStr[4];
    arr[4] =
      arrAwardStr[5] +
      "," +
      arrAwardStr[6] +
      "," +
      arrAwardStr[7] +
      "," +
      arrAwardStr[8] +
      "," +
      arrAwardStr[9] +
      "," +
      arrAwardStr[10] +
      "," +
      arrAwardStr[11];
    arr[5] = arrAwardStr[12];
    arr[6] = arrAwardStr[13] + "," + arrAwardStr[14] + "," + arrAwardStr[15];
    arr[7] = arrAwardStr[16];
    arr[8] = arrAwardStr[17];
    return arr;
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

  getArrAwardInt(
    createRequestDto: LotteryRequestDetailDto,
    lotteryInfo: LotteryInfo
  ) {
    const matricGiai = this.initMatricGiai(lotteryInfo);
    // TODO: for giải lo, giải đặc biêt
    let awardAndRate = [];

    for (let i = 0; i < 5; i++) {
      const { error, arrAwardInt, rate, totalPay, listAward, arrAwardStr } =
        this.genRandomArrAwardInt(
          createRequestDto,
          lotteryInfo,
          matricGiai,
          true
        );
      if (!error && rate >= 0.05 && rate < 1) {
        awardAndRate.push({ arrAwardInt, rate, totalPay, listAward, arrAwardStr });
      }
    }
    if (awardAndRate.length == 0) {
      const { error, arrAwardInt, rate, totalPay, listAward, arrAwardStr } =
        this.genRandomArrAwardInt(
          createRequestDto,
          lotteryInfo,
          matricGiai,
          false
        );
      return {
        arrAwardInt,
        totalPay,
        arrAwardStr,
      };
    }

    awardAndRate = awardAndRate.sort((a, b) => a.rate - b.rate);
    return {
      arrAwardInt: awardAndRate[0].arrAwardInt,
      totalPay: awardAndRate[0].totalPay,
      arrAwardStr: awardAndRate[0].arrAwardStr,
    };
  }

  initMatricGiai(lotteryInfo: LotteryInfo) {
    const arrAward: number[] = [];
    for (let i = 0; i < 18; i++) {
      arrAward.push(-1);
    }
    const matricGiai: MatricGiai = {
      arrGiai0: new Array(),
      arrGiai8: new Array(),
      arrGiaiLo: new Array(),
      whiteListLo: new Array(),
      whiteListGia0: new Array(),
      whiteListGia8: new Array(),
      arrAwardInt: arrAward,
    };

    lotteryInfo.mapMatricInt.forEach((value, key) => {
      if (value.giai0Pay > 0) {
        matricGiai.arrGiai0.push({ value: key, amount: value.giai0Pay });
      } else {
        matricGiai.whiteListGia0.push(key);
      }

      if (value.giai8Pay > 0) {
        matricGiai.arrGiai8.push({ value: key, amount: value.giai8Pay });
      } else {
        matricGiai.whiteListGia8.push(key);
      }

      if (value.giaiLoPay > 0) {
        matricGiai.arrGiaiLo.push({ value: key, amount: value.giaiLoPay });
      } else {
        matricGiai.whiteListLo.push(key);
      }
    });

    if (matricGiai.arrGiai0.length > 0) {
      for (var i = 0; i < matricGiai.arrGiai0.length; i++) {
        if (matricGiai.arrGiai0[i].amount > lotteryInfo.rootTotalRevenue) {
          matricGiai.arrGiai0.splice(i, 1);
          i--;
        }
      }
    }

    if (matricGiai.arrGiai8.length > 0) {
      for (var i = 0; i < matricGiai.arrGiai8.length; i++) {
        if (matricGiai.arrGiai8[i].amount > lotteryInfo.rootTotalRevenue) {
          matricGiai.arrGiai8.splice(i, 1);
          i--;
        }
      }
    }

    if (matricGiai.arrGiaiLo.length > 0) {
      for (var i = 0; i < matricGiai.arrGiaiLo.length; i++) {
        if (matricGiai.arrGiaiLo[i].amount > lotteryInfo.rootTotalRevenue) {
          matricGiai.arrGiaiLo.splice(i, 1);
          i--;
        }
      }
    }

    if (matricGiai.arrGiai0.length > 0) {
      matricGiai.arrGiai0 = matricGiai.arrGiai0.sort(
        (a, b) => a.amount - b.amount
      );
    }
    if (matricGiai.arrGiai8.length > 0) {
      matricGiai.arrGiai8 = matricGiai.arrGiai8.sort(
        (a, b) => a.amount - b.amount
      );
    }
    if (matricGiai.arrGiaiLo.length > 0) {
      matricGiai.arrGiaiLo = matricGiai.arrGiaiLo.sort(
        (a, b) => a.amount - b.amount
      );
    }

    return matricGiai;
  }

  genRandomArrAwardInt(
    createRequestDto: LotteryRequestDetailDto,
    lotteryInfo: LotteryInfo,
    matricGiai: MatricGiai,
    isRandom: boolean,
  ) {
    const arrAwardStr: string[] = []; // giải chính thức ra
    for (let i = 0; i < 18; i++) {
      arrAwardStr.push('');
    }
    let totalPayment = 0;
    const mapAwardPrinft = new Map<number, any>();

    const matricGiaiNew: MatricGiai = { ...matricGiai };

    // 0
    const award0Dto = this.initAwardGiai0(
      matricGiaiNew,
      lotteryInfo,
      mapAwardPrinft,
      isRandom,
      totalPayment,
      createRequestDto
    );
    totalPayment = totalPayment + award0Dto.paymentSub;
    arrAwardStr[0] = award0Dto.awardStr;

    // 17
    const award8Dto = this.randomGiai8(
      matricGiaiNew,
      lotteryInfo,
      mapAwardPrinft,
      isRandom,
      totalPayment,
      createRequestDto
    );
    totalPayment = totalPayment + award8Dto.paymentSub;
    arrAwardStr[17] = award8Dto.awardStr;

    const paymentGiai1to7 = this.initGiai1To7(matricGiaiNew,
      lotteryInfo,
      mapAwardPrinft,
      arrAwardStr,
      isRandom,
      totalPayment,
      createRequestDto
    );
    totalPayment = totalPayment + paymentGiai1to7;
    return {
      error: false,
      arrAwardInt: matricGiaiNew.arrAwardInt,
      rate: 1 - (totalPayment * 1.0) / (1.0 * lotteryInfo.rootTotalRevenue),
      totalPay: totalPayment,
      listAward: mapAwardPrinft,
      arrAwardStr: arrAwardStr,
    };
  }

  initAwardGiai0(
    matricGiaiNew: MatricGiai,
    lotteryInfo: LotteryInfo,
    mapAwardPrinft: Map<number, any>,
    isRandom: boolean,
    totalPay: number,
    createRequestDto: LotteryRequestDetailDto,
  ) {

    const arrSubAwardRandom: SubAwardDto[] = [];

    for (let i = 0; i < this.loop3And4Length; i++) {
      const subAwardRandom = this.randomGiai0(matricGiaiNew,
        lotteryInfo,
        mapAwardPrinft,
        isRandom,
        totalPay,
        createRequestDto
      );

      if (subAwardRandom.isInclude3And4 == false) {
        matricGiaiNew.arrAwardInt[17] = subAwardRandom.awardInt;
        return subAwardRandom;
      }
      arrSubAwardRandom.push(subAwardRandom);

    }

    const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
    matricGiaiNew.arrAwardInt[17] = arrSortAward[0].awardInt;
    return arrSortAward[0];
  }

  randomGiai0(matricGiaiNew: MatricGiai,
    lotteryInfo: LotteryInfo,
    mapAwardPrinft: Map<number, any>,
    isRandom: boolean,
    totalPay: number,
    createRequestDto: LotteryRequestDetailDto,
  ) {
    let awardInt = null;
    let pay2So = 0;

    if (matricGiaiNew.arrGiai0.length == 0) {
      const index = this.genRandom(0, matricGiaiNew.whiteListGia0.length - 1);
      // matricGiaiNew.arrAward[0] = matricGiaiNew.whiteListGia0[index];
      awardInt = matricGiaiNew.whiteListGia0[index];
    } else {
      const index = this.genRandom(0, matricGiaiNew.arrGiai0.length - 1);
      if (
        index < matricGiaiNew.arrGiai0.length - 1 &&
        isRandom &&
        totalPay + matricGiaiNew.arrGiai0[index].amount <
        +lotteryInfo.minWinNhaCai &&
        +matricGiaiNew.arrGiai0[0].amount <
        lotteryInfo.rootTotalRevenue * lotteryInfo.rateDeWin
      ) {
        awardInt = matricGiaiNew.arrGiai0[index].value;
        pay2So = matricGiaiNew.arrGiai0[index].amount;
        // matricGiaiNew.arrAward[0] = matricGiaiNew.arrGiai0[index].value;
        // totalPay = totalPay + matricGiaiNew.arrGiai0[index].amount;
        this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai0[index]);
      } else {
        if (
          matricGiaiNew.arrGiai0.length == lotteryInfo.maxlength2so ||
          (matricGiaiNew.arrGiai0[0].amount + totalPay <
            +lotteryInfo.minWinNhaCai &&
            +matricGiaiNew.arrGiai0[0].amount <
            lotteryInfo.rootTotalRevenue * lotteryInfo.rateDeWin) ||
          matricGiaiNew.whiteListGia0.length == 0
        ) {
          awardInt = matricGiaiNew.arrGiai0[0].value;
          pay2So = matricGiaiNew.arrGiai0[0].amount;
          // matricGiaiNew.arrAward[0] = matricGiaiNew.arrGiai0[0].value;
          // totalPay = totalPay + matricGiaiNew.arrGiai0[0].amount;
          this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai0[0]);
        } else {
          const index = this.genRandom(
            0,
            matricGiaiNew.whiteListGia0.length - 1
          );
          awardInt = matricGiaiNew.whiteListGia0[index];
        }
      }
    }

    // check 3 va 4 so
    const arrSubAwardRandom: SubAwardDto[] = [];
    for (let i = 0; i < this.loopPrefix; i++) {
      const prefix4So = this.genRandom(0, 9999);
      const award6So = this.getStrLength4(prefix4So) + this.getStrLength2(awardInt);

      const payLo3So = this.getPayment3o(award6So, createRequestDto?.baoLo?.lo3So);
      const payLo4So = this.getPayment4o(award6So, createRequestDto?.baoLo?.lo4So);
      // TODO de 3 so, 4 so
      const totaPayment3so4So = payLo3So + payLo4So + pay2So;
      if (payLo3So + payLo4So == 0) {
        const subAward: SubAwardDto = {
          awardInt: awardInt,
          awardStr: award6So,
          isInclude3And4: false,
          paymentSub: totaPayment3so4So
        }
        return subAward;

      }
      arrSubAwardRandom.push({ awardInt: awardInt, awardStr: award6So, isInclude3And4: true, paymentSub: totaPayment3so4So });
    }

    const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
    return arrSortAward[0];
  }

  getPayment3o(award4So: string, lo3So: ValueDto[]) {
    if (!lo3So || lo3So.length === 0) return 0;
    let payment = 0;
    for (const element of lo3So) {
      if (element.value && award4So.toString().endsWith(this.getStrLength3(element.value))) {
        payment = payment + (+element.amount * +RateCaculation.Lo_3_So);
      }
    }

    return payment;
  }


  getPayment4o(award4So: string, arrValueDto: ValueDto[]) {
    if (!arrValueDto || arrValueDto.length === 0) return 0;
    let payment = 0;
    for (const element of arrValueDto) {
      if (element.value && award4So.toString().endsWith(this.getStrLength4(element.value))) {
        payment = payment + (+element.amount * +RateCaculation.Lo_4_So);
      }
    }

    return payment;
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

  pushMapAward(mapAward: Map<number, any>, baseGiaiDto: BaseGiaiDto) {
    const data = mapAward.get(baseGiaiDto.value);
    if (data) {
      data.amount = +data.amount + baseGiaiDto.amount;
      mapAward.set(baseGiaiDto.value, data);
    } else {
      mapAward.set(baseGiaiDto.value, {
        value: baseGiaiDto.value,
        amount: baseGiaiDto.amount,
      });
    }
  }

  randomGiai8(matricGiaiNew: MatricGiai,
    lotteryInfo: LotteryInfo,
    mapAwardPrinft: Map<number, any>,
    isRandom: boolean,
    totalPay: number,
    createRequestDto: LotteryRequestDetailDto,
  ) {
    let awardInt = null;
    let pay2So = 0;

    if (
      matricGiaiNew.arrGiai8.length == 0 ||
      matricGiaiNew.whiteListGia8.length === lotteryInfo.maxlength2so
    ) {
      const index = this.genRandom(0, matricGiaiNew.whiteListGia8.length - 1);
      awardInt = matricGiaiNew.whiteListGia8[index];
    } else {
      const index = this.genRandom(0, matricGiaiNew.arrGiai8.length - 1);

      if (
        index < matricGiaiNew.arrGiai8.length - 1 &&
        isRandom &&
        totalPay + matricGiaiNew.arrGiai8[index].amount <
        lotteryInfo.minWinNhaCai
      ) {
        awardInt = matricGiaiNew.arrGiai8[index].value;
        pay2So = matricGiaiNew.arrGiai8[index].amount;
        this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai8[index]);
      } else {
        if (
          matricGiaiNew.arrGiai8.length == lotteryInfo.maxlength2so ||
          (matricGiaiNew.arrGiai8[0].amount + totalPay <
            lotteryInfo.minWinNhaCai &&
            +matricGiaiNew.arrGiai8[0].amount <
            lotteryInfo.rootTotalRevenue * lotteryInfo.rateDeWin) ||
          matricGiaiNew.whiteListGia8.length == 0
        ) {
          awardInt = matricGiaiNew.arrGiai8[0].value;
          pay2So = matricGiaiNew.arrGiai8[0].amount;
          this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai8[0]);
        } else {
          const index = this.genRandom(
            0,
            matricGiaiNew.whiteListGia8.length - 1
          );
          awardInt = matricGiaiNew.whiteListGia8[index];
        }
      }
    }
    matricGiaiNew.arrAwardInt[17] = awardInt;
    const subAward: SubAwardDto = {
      awardInt: awardInt,
      awardStr: this.getStrLength2(awardInt),
      isInclude3And4: false,
      paymentSub: pay2So
    }
    return subAward;
  }

  initGiai1To7(matricGiaiNew: MatricGiai,
    lotteryInfo: LotteryInfo,
    mapAwardPrinft: Map<number, any>,
    arrAwardStr: string[],
    isRandom: boolean,
    totalPay: number,
    createRequestDto: LotteryRequestDetailDto,
  ): number {
    // remove giai 0 va 8
    for (let i = 0; i < matricGiaiNew.arrGiaiLo.length; i++) {
      if (matricGiaiNew.arrGiaiLo[i].value == matricGiaiNew.arrAwardInt[17]) {
        matricGiaiNew.arrGiaiLo.slice(i, 1);
      } else if (
        matricGiaiNew.arrGiaiLo[i].value == matricGiaiNew.arrAwardInt[0]
      ) {
        matricGiaiNew.arrGiaiLo.slice(i, 1);
      }
    }

    // TODO xem lai cach tinh 3 va 4
    let paymentGiai1to7 = 0;


    if (
      matricGiaiNew.arrGiaiLo.length == 0 ||
      matricGiaiNew.whiteListLo.length == lotteryInfo.maxlength2so
    ) {
      for (let i = 1; i < 17; i++) {
        const index = this.genRandom(0, matricGiaiNew.whiteListLo.length - 1);
        matricGiaiNew.arrAwardInt[i] = matricGiaiNew.whiteListLo[index];
        paymentGiai1to7 = paymentGiai1to7 + 0 + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
      }
    } else {
      for (let i = 1; i < 17; i++) {
        const index = this.genRandom(0, matricGiaiNew.arrGiaiLo.length - 1);
        if (
          index < matricGiaiNew.arrGiaiLo.length - 1 &&
          isRandom &&
          totalPay + paymentGiai1to7 + matricGiaiNew.arrGiaiLo[index].amount <
          lotteryInfo.minWinNhaCai
        ) {
          matricGiaiNew.arrAwardInt[i] = matricGiaiNew.arrGiaiLo[index].value;
          // totalPay = totalPay + matricGiaiNew.arrGiaiLo[index].amount;
          paymentGiai1to7 = paymentGiai1to7 + matricGiaiNew.arrGiaiLo[index].amount + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
          this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiaiLo[index]);

          if (matricGiaiNew.arrGiaiLo.length > 1) {
            matricGiaiNew.arrGiaiLo.splice(index, 1);
          } else {
            matricGiaiNew.arrGiaiLo = [];
          }
        } else {
          if (
            (matricGiaiNew.arrGiaiLo.length > 0 &&
              totalPay + paymentGiai1to7 + matricGiaiNew.arrGiaiLo[0].amount <
              lotteryInfo.minWinNhaCai) ||
            matricGiaiNew.whiteListGia8.length == 0
          ) {
            matricGiaiNew.arrAwardInt[i] = matricGiaiNew.arrGiaiLo[0].value;
            // totalPay = totalPay + matricGiaiNew.arrGiaiLo[0].amount;
            paymentGiai1to7 = paymentGiai1to7 + matricGiaiNew.arrGiaiLo[0].amount + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
            this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiaiLo[0]);
            if (matricGiaiNew.arrGiaiLo.length > 1) {
              matricGiaiNew.arrGiaiLo.splice(0, 1);
            } else {
              matricGiaiNew.arrGiaiLo = [];
            }
          } else {
            const index = this.genRandom(
              0,
              matricGiaiNew.whiteListLo.length - 1
            );
            matricGiaiNew.arrAwardInt[i] = matricGiaiNew.whiteListLo[index];
            paymentGiai1to7 = paymentGiai1to7 + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
          }
        }
      }
    }

    return paymentGiai1to7;
  }

  getPayment3And4SoAwardStr(
    index: number,
    awardInt: number,
    arrAwardStr: string[],
    createRequestDto: LotteryRequestDetailDto,
  ) {
    if (index <= 11) {
      const prefix3So = this.genRandom(0, 999);
      const award5So = this.getStrLength3(prefix3So) + this.getStrLength2(awardInt);
      const subAwardDto = this.processGetPayment3And4So(createRequestDto, awardInt, award5So);
      arrAwardStr[index] = subAwardDto.awardStr;
      return subAwardDto.paymentSub;
    }
    if (index <= 15) {
      const prefix3So = this.genRandom(0, 99);
      const award4So = this.getStrLength2(prefix3So) + this.getStrLength2(awardInt);
      const subAwardDto = this.processGetPayment3And4So(createRequestDto, awardInt, award4So);
      arrAwardStr[index] = subAwardDto.awardStr;
      return subAwardDto.paymentSub;
    }
    if (index <= 16) {
      const prefix3So = this.genRandom(0, 9);
      const award3So = `${prefix3So}` + this.getStrLength2(awardInt);
      const subAwardDto = this.processGetPayment3So(createRequestDto, awardInt, award3So);
      arrAwardStr[index] = subAwardDto.awardStr;
      return subAwardDto.paymentSub;
    }
    return 0;
  }

  processGetPayment3And4So(
    createRequestDto: LotteryRequestDetailDto,
    awardInt: number,
    subAwardStr: string,
  ) {
    const arrSubAwardRandom: SubAwardDto[] = [];
    for (let i = 0; i < this.loopPrefix; i++) {

      const payLo3So = this.getPayment3o(subAwardStr, createRequestDto?.baoLo?.lo3So);
      const payLo4So = this.getPayment4o(subAwardStr, createRequestDto?.baoLo?.lo4So);
      // TODO de 3 so, 4 so
      const totaPayment3so4So = payLo3So + payLo4So;
      if (payLo3So + payLo4So == 0) {
        const subAward: SubAwardDto = {
          awardInt: awardInt,
          awardStr: subAwardStr,
          isInclude3And4: false,
          paymentSub: totaPayment3so4So
        }
        return subAward;

      }
      arrSubAwardRandom.push({ awardInt: awardInt, awardStr: subAwardStr, isInclude3And4: true, paymentSub: totaPayment3so4So });
    }

    const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
    return arrSortAward[0];
  }

  processGetPayment3So(
    createRequestDto: LotteryRequestDetailDto,
    awardInt: number,
    subAwardStr: string,
  ) {
    const arrSubAwardRandom: SubAwardDto[] = [];
    for (let i = 0; i < this.loopPrefix; i++) {
      const payLo3So = this.getPayment3o(subAwardStr, createRequestDto?.baoLo?.lo3So);
      const totaPayment3so4So = payLo3So;
      if (payLo3So == 0) {
        const subAward: SubAwardDto = {
          awardInt: awardInt,
          awardStr: subAwardStr,
          isInclude3And4: false,
          paymentSub: totaPayment3so4So
        }
        return subAward;

      }
      arrSubAwardRandom.push({ awardInt: awardInt, awardStr: subAwardStr, isInclude3And4: true, paymentSub: totaPayment3so4So });
    }

    const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
    return arrSortAward[0];
  }

  async createLotteryAward(createAwardDto: CreateLotteryAwardDto) {
    return await this.lotteryAwardRepository.save(createAwardDto);
  }

  // async create(createAwardDto: CreateLotteryAwardDto, username = ''): Promise<BaseResponse> {
  //   try {
  //     const lotteryAwardFound = await this.lotteryAwardRepository.findOneBy({
  //       type: createAwardDto.type,
  //       turnIndex: createAwardDto.turnIndex,
  //     });

  //     if (lotteryAwardFound) {
  //       return new ErrorResponse(
  //         STATUSCODE.COMMON_FAILED,
  //         `lotteryAward is already exist`,
  //         ERROR.CREATE_FAILED
  //       );
  //     }

  //     const orders = await this.orderRequestService.getListOrders(createAwardDto);
  //     const ordersAuth = [];
  //     const ordersFake = [];
  //     let totalRevenue = 0;
  //     // TODO Auth fake
  //     for (const order of orders) {
  //       ordersAuth.push(order);
  //       totalRevenue = totalRevenue + +order.revenue;
  //       // if (order.user.isAuth) {
  //       //   ordersAuth.push(order);
  //       //   totalRevenue = totalRevenue + +order.revenue;
  //       // } else {
  //       //   ordersAuth.push(order);
  //       //   totalRevenue = totalRevenue + +order.revenue;
  //       //   ordersFake.push(order);
  //       // }
  //     }

  //     // const lotteryCreate = {
  //     //   type: createAwardDto.type,
  //     //   turnIndex: createAwardDto.turnIndex,
  //     //   createdAt: new Date(),
  //     //   openTime: new Date(),
  //     //   extraData: {},
  //     //   totalRevenue,
  //     //   status: +StatusLotteryAward.INIT,
  //     // }

  //     // const lotteryAward = await this.lotteryAwardRepository.save(lotteryCreate);
  //     let lotteryAward: any;

  //     const lotteryRequest = await this.initLotteryRequest(createAwardDto, ordersAuth);
  //     // const { error: errorResponse, data: dataResponse } = await this.connectService.processInitLotteryAward(lotteryRequest);
  //     const dataRes = await this.processInitLotteryAward(lotteryRequest);
  //     const dataResponse = dataRes?.result?.data;

  //     lotteryAward.extraData = dataResponse;
  //     await this.lotteryAwardRepository.save(lotteryAward);

  //     // nếu data trả về là ko có kết quả
  //     // if (!dataResponse?.awardDetail) {
  //     //   if (orders.length > 0) {
  //     //     if (ordersFake.length > 0) {
  //     //       await this.orderRequestService.processRefundListFake(orders);
  //     //     }

  //     //     if (ordersAuth.length > 0) {
  //     //       // TODO auth
  //     //       await this.orderRequestService.processRefundListFake(orders);
  //     //     }
  //     //   }

  //     //   lotteryAward.status = +StatusLotteryAward.ERROR;
  //     //   lotteryAward.extraData = errorResponse;
  //     //   await this.lotteryAwardRepository.save(lotteryAward);

  //     //   return new ErrorResponse(
  //     //     STATUSCODE.INIT_LOTTERY_AWARD_ERROR,
  //     //     `lotteryAward init error`,
  //     //     ERROR.CREATE_FAILED
  //     //   );
  //     // }
  //     const arrOrderAuthWin = new Array;
  //     const arrOrderFakeWin = new Array;
  //     const arrOrderLoser = new Array;
  //     let totalPayment = 0;

  //     const mapAward = new Map<string, any>();
  //     for (const order of orders) {
  //       await this.checkOrderWin(order, dataResponse.awardDetail);
  //       if (+order.paymentWin > 0) {
  //         const data = mapAward.get(order.detail);
  //         if (data) {
  //           data.amount = +data.amount + order.paymentWin;
  //           mapAward.set(order.detail, data);
  //         } else {
  //           mapAward.set(order.detail, { "value": order.detail, "amount": order.paymentWin });
  //         }
  //         // TODO check total payment xem bên nào sai
  //       }
  //       if (order.paymentWin && +order.paymentWin > 0) {
  //         totalPayment = totalPayment + +order.paymentWin;
  //         arrOrderAuthWin.push(order);
  //       } else {
  //         order.status = StatusOrderRequest.LOSER;
  //         arrOrderLoser.push(order);
  //       }
  //     }
  //     if (arrOrderAuthWin.length > 0) {
  //       await this.orderRequestService.processEarnListFake(arrOrderAuthWin);
  //     }

  //     lotteryAward.totalPay = totalPayment;
  //     if (lotteryAward.totalRevenue != 0) {
  //       if (totalPayment != 0) {
  //         lotteryAward.rateWin = 1 - (totalPayment * 1.0) / (1.0 * lotteryAward.totalRevenue);
  //       } else {
  //         lotteryAward.rateWin = 1;
  //       }
  //     }

  //     lotteryAward.awardDetail = dataResponse?.awardDetail;
  //     lotteryAward.awardTitle = dataResponse?.awardTitle;
  //     await this.lotteryAwardRepository.save(lotteryAward);

  //     if (arrOrderFakeWin.length > 0) {
  //       await this.orderRequestService.processEarnListFake(arrOrderFakeWin);
  //     }
  //     await this.orderRequestService.orderRequestLoser(arrOrderLoser);

  //     return new SuccessResponse(
  //       STATUSCODE.COMMON_CREATE_SUCCESS,
  //       lotteryAward,
  //       MESSAGE.CREATE_SUCCESS
  //     );
  //   } catch (error) {
  //     this.logger.debug(
  //       `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
  //     );
  //     return new ErrorResponse(
  //       STATUSCODE.COMMON_FAILED,
  //       error,
  //       ERROR.CREATE_FAILED
  //     );
  //   }
  // }

  async checkOrderWin(order: OrderRequest, awardDetail: string): Promise<boolean> {
    const { values } = convertOrderDetail(order);
    const arrayAward = JSON.parse(awardDetail);
    for (const valueDto of values) {
      if (order.type == `${TypeLottery.XSMB_45_S}`) {
        switch (order.betType) {
          case `${TypeCaculation.De_Dac_Biet}`:
            await this.checkBetDacBiet(order, valueDto, arrayAward);
            break;
          case `${TypeCaculation.De_Dau}`:
            await this.checkDeDau(order, valueDto, arrayAward);
            break;
          case `${TypeCaculation.De_Dau_Duoi}`:
            await this.checkDeDauDuoi(order, valueDto, arrayAward);
            break;
          case `${TypeCaculation.Lo_2_So}`:
            await this.checkLo2So(order, valueDto, arrayAward);
            break;
          case `${TypeCaculation.Lo_2_So_1k}`:
            await this.checkLo2So1k(order, valueDto, arrayAward);
            break;
          case `${TypeCaculation.Lo_3_So}`:
            await this.checkLo3So(order, valueDto, arrayAward);
            break;
          case `${TypeCaculation.Lo_4_So}`:
            await this.checkLo4So(order, valueDto, arrayAward);
            break;
          // TODO check de 3, 4
          default:
            break;
        }
      }

      // TODO XSMB
    }
    return true;
  }

  async checkLo3So(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>) {
    for (const awards of arrayAward) {
      const subArr = awards.split(CharLottery.COMMA);
      for (const award of subArr) {
        if (award.length < 3) {
          continue;
        }
        const lastChars = award.substring(award.length - 3);
        if (+lastChars == valueDto.value) {
          order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.Lo_3_So;
        }
      }
    }

    if (order.paymentWin > 0) {
      return true;
    }
    return false;
  }

  async checkLo4So(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>) {
    for (const awards of arrayAward) {
      const subArr = awards.split(CharLottery.COMMA);
      for (const award of subArr) {
        if (award.length < 4) {
          continue;
        }
        const lastChars = award.substring(award.length - 4);
        if (+lastChars == valueDto.value) {
          order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.Lo_4_So;
        }
      }
    }

    if (order.paymentWin > 0) {
      return true;
    }
    return false;
  }

  async checkLo2So1k(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>) {
    for (const awards of arrayAward) {
      const subArr = awards.split(CharLottery.COMMA);
      for (const award of subArr) {
        const lastChars = award.substring(award.length - 2);
        if (+lastChars == valueDto.value) {
          order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.Lo_2_So_1k;
        }
      }
    }

    if (order.paymentWin > 0) {
      return true;
    }
    return false;
  }

  async checkLo2So(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>) {
    for (const awards of arrayAward) {
      const subArr = awards.split(CharLottery.COMMA);
      for (const award of subArr) {
        const lastChars = award.substring(award.length - 2);
        if (+lastChars == valueDto.value) {
          order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.Lo_2_So;
        }
      }
    }

    if (order.paymentWin > 0) {
      return true;
    }
    return false;
  }

  async checkDeDauDuoi(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>) {
    const lastChars0 = arrayAward[0].substring(arrayAward[0].length - 2);
    if (+lastChars0 == valueDto.value) {
      order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.De_Dau_Duoi;
    }

    const lastChars7 = arrayAward[8].substring(arrayAward[8].length - 2);
    if (+lastChars7 == valueDto.value) {
      order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.De_Dau_Duoi;
    }

    if (order.paymentWin > 0) {
      return true;
    }
    return false;
  }

  async checkDeDau(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>) {
    const lastChars = arrayAward[8].substring(arrayAward[8].length - 2);
    if (+lastChars == valueDto.value) {
      order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.De_Dau;
      return true;
    }

    return false;
  }

  async checkBetDacBiet(order: OrderRequest, valueDto: ValueDto, arrayAward: Array<string>): Promise<boolean> {
    const lastChars = arrayAward[0].substring(arrayAward[0].length - 2);
    if (+lastChars == valueDto.value) {
      order.paymentWin = order.paymentWin + +valueDto.amount * +RateCaculation.De_Dac_Biet;
      return true;
    }

    return false;
  }

  async initLotteryRequest(createAwardDto: CreateLotteryAwardDto, orders: OrderRequest[]) {
    //danh lo
    const lo2So: ValueDto[] = [];
    const lo2So1k: ValueDto[] = [];
    const lo3So: ValueDto[] = [];
    const lo4So: ValueDto[] = [];

    // danh de
    const deDau: ValueDto[] = [];
    const deDacBiet: ValueDto[] = [];
    const deDauDuoi: ValueDto[] = [];

    for (const order of orders) {
      const { values } = convertOrderDetail(order);
      if (values.length == 0) {
      }
      switch (order.betType) {
        case `${TypeCaculation.De_Dac_Biet}`:
          deDacBiet.push(...values)
          break;
        case `${TypeCaculation.De_Dau}`:
          deDau.push(...values)
          break;
        case `${TypeCaculation.De_Dau_Duoi}`:
          deDauDuoi.push(...values)
          break;
        case `${TypeCaculation.Lo_2_So}`:
          lo2So.push(...values)
          break;
        case `${TypeCaculation.Lo_2_So_1k}`:
          lo2So1k.push(...values)
          break;
        case `${TypeCaculation.Lo_3_So}`:
          lo3So.push(...values)
          break;
        case `${TypeCaculation.Lo_4_So}`:
          lo4So.push(...values)
          break;
        // TODO de 3, 4
        default:
          break;
      }
    }

    const baoLo: BaoLoDto = {
      lo2So,
      lo2So1k,
      lo3So,
      lo4So,
    }

    const danhDe: DanhDeDto = {
      deDacBiet,
      deDau,
      deDauDuoi,
    }

    const lotteryRequest: RequestDetailDto = {
      type: createAwardDto.type,
      turnIndex: createAwardDto.turnIndex,
      baoLo,
      danhDe,
    }

    return lotteryRequest;
  }



  async update(id: number, updatelotteryAwardDto: UpdateLotteryAwardDto): Promise<any> {
    try {
      // let foundlotteryAward = await this.lotteryAwardRepository.findOneBy({
      //   id,
      // });

      // if (!foundlotteryAward) {
      //   return new ErrorResponse(
      //     STATUSCODE.COMMON_NOT_FOUND,
      //     `lotteryAward with id: ${id} not found!`,
      //     ERROR.NOT_FOUND
      //   );
      // }

      // foundlotteryAward = {
      //   ...foundlotteryAward,
      //   ...updatelotteryAwardDto,
      //   updatedAt: new Date(),
      // };
      // await this.lotteryAwardRepository.save(foundlotteryAward);

      // return new SuccessResponse(
      //   STATUSCODE.COMMON_UPDATE_SUCCESS,
      //   foundlotteryAward,
      //   MESSAGE.UPDATE_SUCCESS
      // );
    } catch (error) {
      this.logger.debug(
        `${LotteryAwardService.name} is Logging error: ${JSON.stringify(error)}`
      );
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        ERROR.UPDATE_FAILED
      );
    }
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

  async deleteDataResult() {
    const currentDate = new Date();
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    yesterday.setHours(23);
    yesterday.setMinutes(59);
    yesterday.setSeconds(59);
    // delete lotery request
    const dataLotteryReq = await this.lotteryRequestRepository.find(
      {
        where: {
          createdAt: LessThan(yesterday)
        }
      }
    );
    if (dataLotteryReq?.length > 0) {
      dataLotteryReq.map(async (item) => {
        await this.lotteryRequestRepository.delete(item?.id)
      })
    }

    // delete lotery award
    const dataLotteryAward = await this.lotteryAwardRepository.find(
      {
        where: {
          createdAt: LessThan(yesterday)
        }
      }
    );
    if (dataLotteryAward?.length > 0) {
      dataLotteryAward.map(async (item) => {
        await this.lotteryAwardRepository.delete(item?.id)
      })
    }
  }
}

export function convertOrderDetail(order: OrderRequest) {
  const values: ValueDto[] = [];

  // TODO add whitelist for types
  if (order.type === `${TypeLottery.XSMB}` ||
    order.type === `${TypeLottery.XSN_45s}` ||
    order.type === `${TypeLottery.XSN_TEST}` ||
    order.type === `${TypeLottery.XSMB_45_S}`
  ) {
    const regex = /^[0-9,|]+$/;
    if (!regex.test(order.detail)) {
      return { values: [], error: true };
    }

    if (order.betType === `${TypeCaculation.Lo_3_So}`) {
      return convertOrderDetail3So(order)
    }
    if (order.betType === `${TypeCaculation.Lo_4_So}`) {
      return convertOrderDetail4So(order)
    }

    // const regex = /^[0-9,|]+$/;
    // if (!regex.test(order.detail)) {
    //   return { values: [], error: true };
    // }

    const arrPipes = order.detail.split(`${CharLottery.PIPE}`);
    if (arrPipes.length != 2) {
      return { values: [], error: true };
    }
    const arrLeft = arrPipes[0].split(`${CharLottery.COMMA}`);
    const arrRight = arrPipes[1].split(`${CharLottery.COMMA}`);

    if (arrLeft.length == 0 || arrRight.length == 0) {
      return { values: [], error: true };
    }
    const amountOnePiece = (+order.revenue * 1.0) / (1.0 * arrLeft.length * arrRight.length);

    for (const str of arrLeft) {
      for (const str2 of arrRight) {
        if (+`${str}${str2}` >= 100) {
          return { values: [], error: true };
        }

        const value: ValueDto = {
          amount: amountOnePiece,
          value: +`${str}${str2}`,
        }
        values.push(value);
      }
    }

    return { values, error: false };
  }

  return { values, error: true };
}



export function convertOrderDetail3So(order: OrderRequest) {
  const values: ValueDto[] = [];

  // TODO add whitelist for types
  if (order.type === `${TypeLottery.XSMB}` ||
    order.type === `${TypeLottery.XSN_45s}` ||
    order.type === `${TypeLottery.XSN_TEST}` ||
    order.type === `${TypeLottery.XSMB_45_S}`
  ) {
    const regex = /^[0-9,|]+$/;
    if (!regex.test(order.detail)) {
      return { values: [], error: true };
    }

    const arrPipes = order.detail.split(`${CharLottery.PIPE}`);
    if (arrPipes.length != 3) {
      return { values: [], error: true };
    }
    const arr1 = arrPipes[0].split(`${CharLottery.COMMA}`);
    const arr2 = arrPipes[1].split(`${CharLottery.COMMA}`);
    const arr3 = arrPipes[2].split(`${CharLottery.COMMA}`);

    if (arr1.length == 0 || arr2.length == 0 || arr3.length == 0) {
      return { values: [], error: true };
    }
    const amountOnePiece = (+order.revenue * 1.0) / (1.0 * arr1.length * arr2.length * arr3.length);

    for (const str of arr1) {
      for (const str2 of arr2) {
        for (const str3 of arr3) {
          if (+`${str}${str2}${str3}` >= 1000) {
            return { values: [], error: true };
          }
          const value: ValueDto = {
            amount: amountOnePiece,
            value: +`${str}${str2}${str3}`,
          }
          values.push(value);
        }

      }
    }

    return { values, error: false };
  }

  return { values, error: true };
}


export function convertOrderDetail4So(order: OrderRequest) {
  const values: ValueDto[] = [];

  // TODO add whitelist for types
  if (order.type === `${TypeLottery.XSMB}` ||
    order.type === `${TypeLottery.XSN_45s}` ||
    order.type === `${TypeLottery.XSN_TEST}` ||
    order.type === `${TypeLottery.XSMB_45_S}`
  ) {
    const regex = /^[0-9,|]+$/;
    if (!regex.test(order.detail)) {
      return { values: [], error: true };
    }

    const arrPipes = order.detail.split(`${CharLottery.PIPE}`);
    if (arrPipes.length != 4) {
      return { values: [], error: true };
    }
    const arr1 = arrPipes[0].split(`${CharLottery.COMMA}`);
    const arr2 = arrPipes[1].split(`${CharLottery.COMMA}`);
    const arr3 = arrPipes[2].split(`${CharLottery.COMMA}`);
    const arr4 = arrPipes[3].split(`${CharLottery.COMMA}`);

    if (arr1.length == 0 || arr2.length == 0 || arr3.length == 0 || arr4.length == 0) {
      return { values: [], error: true };
    }
    const amountOnePiece = (+order.revenue * 1.0) / (1.0 * arr1.length * arr2.length * arr3.length * arr4.length);

    for (const str of arr1) {
      for (const str2 of arr2) {
        for (const str3 of arr3) {
          for (const str4 of arr4) {
            if (+`${str}${str2}${str3}${str4}` >= 10000) {
              return { values: [], error: true };
            }
            const value: ValueDto = {
              amount: amountOnePiece,
              value: +`${str}${str2}${str3}${str4}`,
            }
            values.push(value);
          }
        }
      }
    }

    return { values, error: false };
  }

  return { values, error: true };
}
