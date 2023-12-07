import { HttpService } from "@nestjs/axios";
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as dotenv from "dotenv";
import { firstValueFrom, map } from "rxjs";
import { Repository } from "typeorm";
import { Logger } from "winston";
import { PaginationQueryDto } from "../../common/common.dto";
import { Debug } from "../../common/helper/debug";
import { ConfigSys, Helper } from "../../common/helper/index";
import { UserRoles } from "../../components/user/enums/user.enum";
import { User } from "../../components/user/user.entity";
import { Order, STATUSCODE } from "../../system/constants";
import { ErrorResponse } from "../../system/interfaces";
import { API } from "../api.third/api.entity";
import { EventTimeService } from "../event.time.third/event.time.third.service";
import {
  SYS_ITEM_ENUM,
  SYS_MODULE_ENUM,
} from "../sys.config/enums/sys.config.enum";
import { SysConfig } from "../sys.config/sys.config.entity";
import { EventTime } from "./../event.time.third/event.time.third.entity";
import { GameTypeEnum, NameGamTypeEnum } from "./../game.type/game.type.enum";
import { ConectEnum } from "./connect.enum";
import { format } from "date-fns";
import { ListPaymentRequestDto } from "../order.request/dto/list.payment.request";
import { RequestDetailDto } from "../lottery.request/dto/request.detail.dto";

@Injectable()
export class ConnectService {



  /***
   * Fetch database
   */
  private body: any = {};

  private options: any = {
    headers: {
      "Accept-Encoding": "gzip,deflate,compress",
      "accept-language": "vi-VN,vi",
    },
  };

  private url = "";

  private start = "";

  private end = "";

  private action = "";

  /**
   * Fetch .evn file
   */
  private department = "";

  private gameName = "";

  private multiple = 0;

  private remark = "";

  private password = "";

  private actions = [
    `${ConectEnum.LOGIN}`,
    `${ConectEnum.UPDATE}`,
    `${ConectEnum.PAYMENT_AUTH}`,
    `${ConectEnum.PAYMENT_FAKE}`,
    `${ConectEnum.GET_INFO_FAKE}`,
    `${ConectEnum.LOTTERY_AWARD_AUTH}`,
    `${ConectEnum.LOTTERY_AWARD_FAKE}`,
  ];

  private vips: any = [];

  constructor(
    @InjectRepository(API)
    private apiRepository: Repository<API>,
    @InjectRepository(EventTime)
    private eventTimeRepository: Repository<EventTime>,
    private readonly httpService: HttpService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SysConfig)
    private sysConfigRepository: Repository<SysConfig>,
    @Inject("winston")
    private readonly logger: Logger,
    private eventTimeService: EventTimeService
  ) {
    this.vips = process.env.VIP_LIST.split(",");
    dotenv.config();
  }

  getDep() {
    return this.department;
  }

  setDep(department: string) {
    this.department = department;
  }

  async getMultiple() {
    try {
      const multipleConfig = await this.sysConfigRepository.findOneBy({
        module: SYS_MODULE_ENUM.MULTIPLE,
        item: SYS_ITEM_ENUM.MULTIPLE,
        isDeleted: false,
      });

      if (!multipleConfig) return this.multiple;
      const value = multipleConfig.value;
      return parseInt(value, 10) ? parseInt(value, 10) : this.multiple;
    } catch (error) {
      return this.multiple;
    }
  }

  setMultiple(multiple: number) {
    this.multiple = multiple;
  }

  getRemark() {
    return this.remark;
  }

  setRemark(remark: string) {
    this.remark = remark;
  }

  getGameName() {
    return this.gameName;
  }

  setGameName(gameName: string) {
    this.gameName = gameName;
  }

  getURL() {
    return this.url;
  }

  setURL(url: string) {
    this.url = url;
  }

  getAction() {
    return this.action;
  }

  setAction(action: string) {
    this.action = action;
  }

  getBody() {
    return this.body;
  }

  setBody(data: any) {
    this.body = data;
  }

  setStart(start: Date) {
    this.start = Helper.convertTime(start);
  }

  setEnd(end: Date) {
    this.end = Helper.convertTime(end);
  }

  getStart() {
    return this.start;
  }

  getEnd() {
    return this.end;
  }


  async processInitLotteryAward(lotteryRequest: RequestDetailDto): Promise<any> {
    try {
      await this.compose(ConectEnum.LOTTERY_AWARD_FAKE);
      this.body = lotteryRequest;
      const response = await this.connect();
      if (!response || response?.data?.code != +STATUSCODE.COMMON_CREATE_SUCCESS) {
        return { error: response };
      }

      return { data: response.data.result };
    } catch (error) {
      return { error: error }
    }
  }

  async paymentFake(userPaymentRequest: ListPaymentRequestDto): Promise<any> {
    await this.compose(ConectEnum.PAYMENT_FAKE);

    this.body = userPaymentRequest;
    const response = await this.connect();

    return response?.data?.result?.payments;
  }

  async paymentAuth(userPaymentRequest: ListPaymentRequestDto): Promise<any> {
    await this.compose(ConectEnum.PAYMENT_AUTH);

    this.body = userPaymentRequest;
    const response = await this.connect();

    return response?.data?.result?.payments;
  }


  async getDataLottery(typeLottery: string, from: Date = new Date(), to: Date = new Date()) {
    const body1688xoso = 'area=code&from=fromDate&to=toDate';
    const fromDate = format(from, 'yyyy-MM-dd');
    const toDate = format(to, 'yyyy-MM-dd');
    const body = body1688xoso.replace('fromDate', fromDate).replace('toDate', toDate).replace('code', typeLottery);
    const url1688xoso = 'https://1688xoso.net/wp-json/get-data/xstt';
    return await this.connectWith(url1688xoso, body);
  }

  async update(userName = "", awardAmount = 0, multiple = 0) {
    // const paginationQueryDto: PaginationQueryDto = {
    //   take: 1,
    //   skip: 1,
    //   order: Order.DESC,
    //   keyword: null,
    // };
    // const event = await this.eventTimeService.getAll(paginationQueryDto);

    // if (event.length >= 1) {
    //   const today = new Date(event[0]?.result?.start);
    //   this.setRemark(`LUCKYTICKET_${Helper.convertTime(today)}`);
    // } else {
    //   const today = new Date();
    //   this.setRemark(`LUCKYTICKET_${Helper.convertTime(today)}`);
    // }

    // await this.compose(ConectEnum.UPDATE);
    // await this.bodyUpdate(userName, awardAmount, multiple);
    // return this.connect();
  }

  async logIn(userName = "", sign = ""): Promise<any> {
    const signLocal = Helper.endCodeUsername(userName);
    if (sign != signLocal) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: `Sign not correct`,
        },
        HttpStatus.BAD_REQUEST
      );
    }

    await this.compose(ConectEnum.LOGIN);

    const gameType = this.getGameType();

    for (const index in gameType) {
      this.bodyLogin(userName, gameType[index].type);
      const data = await this.connect();
      const isUser =
        Debug.typeOf(data?.code) === "Number" &&
        data?.code == 0 &&
        this.vips.includes(data?.data.level);
      if (isUser) {
        await this.checkUser(userName);
        return data;
      }
      if (data?.data?.level && !this.vips.includes(data?.data?.level)) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: `Unconditional account`,
          },
          HttpStatus.NOT_FOUND
        );
      }
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: data,
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  async isNotAuth(userName = ""): Promise<any> {
    await this.compose(ConectEnum.GET_INFO_FAKE);

    this.body = { username: userName };
    const data = await this.connect();

    if (data?.data?.code != +STATUSCODE.COMMON_SUCCESS) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: data,
        },
        HttpStatus.NOT_FOUND
      );
    }
    return data;
  }

  async getBalanceUseNotAuth(username: string) {
    await this.compose(ConectEnum.GET_INFO_FAKE);

    this.body = { username, walletBalance: 1 };
    const data = await this.connect();

    if (data?.data?.code != +STATUSCODE.COMMON_SUCCESS) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: data,
        },
        HttpStatus.NOT_FOUND
      );
    }
    return data;
  }


  async fetch(userName = ""): Promise<any> {
    await this.compose(ConectEnum.LOGIN);

    const gameType = this.getGameType();
    const collections = [];

    for (const index in gameType) {
      this.bodyLogin(userName, gameType[index].type);
      const data = await this.connect();

      if (Debug.typeOf(data?.code) === "Number" && data?.code == 0) {
        collections.push(data);
      }
    }

    if (gameType.length == collections.length) {
      return collections;
    }

    return [];
  }

  async fetchFromToDate(
    userName: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any> {
    await this.compose(ConectEnum.LOGIN);

    const gameType = this.getGameType();
    const collections = [];

    for (const index in gameType) {
      this.bodyInfoFromToDate(userName, gameType[index].type, fromDate, toDate);
      const data = await this.connect();

      if (Debug.typeOf(data?.code) === "Number" && data?.code == 0) {
        collections.push(data);
      }
    }

    if (gameType.length == collections.length) {
      return collections;
    }

    return [];
  }

  async getDepositFromToDate(
    userName: string,
    fromDate: Date,
    toDate: Date
  ): Promise<number> {
    await this.compose(ConectEnum.LOGIN);
    const gameType = this.getGameType();

    for (const index in gameType) {
      this.bodyInfoFromToDate(userName, gameType[index].type, fromDate, toDate);
      const data = await this.connect();
      if (Debug.typeOf(data?.code) === "Number" && data?.code == 0) {
        return data?.data?.totalRechargeAmount;
      } else {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: data,
          },
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }

  async getDeposit(userName: string): Promise<number> {
    await this.compose(ConectEnum.LOGIN);
    const gameType = this.getGameType();

    for (const index in gameType) {
      this.bodyLogin(userName, gameType[index].type);
      const data = await this.connect();
      if (Debug.typeOf(data?.code) === "Number" && data?.code == 0) {
        return data?.data?.totalRechargeAmount;
      } else {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: data,
          },
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }

  async getDepositAndRevenue(userName = ""): Promise<any> {
    await this.compose(ConectEnum.LOGIN);
    const data = await this.fetch(userName);
    const deposit = data[0]?.data?.totalRechargeAmount;
    let revenue = 0;

    for (const index in data) {
      revenue += data[index]?.data?.totalValidBetAmount;
    }
    return { deposit, revenue };
  }

  async getDepositAndRevenueFromToDate(
    userName: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{ deposit: number; revenue: number }> {
    await this.compose(ConectEnum.LOGIN);
    const data = await this.fetchFromToDate(userName, fromDate, toDate);
    const deposit = data[0]?.data?.totalRechargeAmount;
    let revenue = 0;

    for (const index in data) {
      revenue += data[index]?.data?.totalValidBetAmount;
    }
    return { deposit, revenue };
  }

  // async fetchWithCondition(
  //   userName: string,
  //   condition: UserCondition
  // ): Promise<any> {
  //   if (!userName) {
  //     userName = "";
  //   }
  //   await this.compose(ConectEnum.LOGIN);

  //   const gameType = this.getGameType();
  //   const collections = [];

  //   for (const index in gameType) {
  //     this.bodyLoginWithCondition(userName, gameType[index].type, condition);
  //     const data = await this.connect();

  //     if (Debug.typeOf(data?.code) === "Number" && data?.code == 0) {
  //       collections.push(data);
  //     } else {
  //       throw new HttpException(
  //         {
  //           status: HttpStatus.NOT_FOUND,
  //           error: data,
  //         },
  //         HttpStatus.NOT_FOUND
  //       );
  //     }
  //   }

  //   if (gameType.length == collections.length) {
  //     return collections;
  //   }

  //   return [];
  // }

  async compose(action = "") {
    this.getConfig();
    await this.preConnect(action);
  }

  async connect(): Promise<any> {
    try {
      // console.log("body", this.getBody())
      // console.log("urL", this.getURL())
      const data = await firstValueFrom(
        this.httpService
          .post(this.getURL(), this.getBody(), this.options)
          .pipe(map((resp) => resp.data))
      );

      return data;
    } catch (error) {
      this.logger.error(
        `${JSON.stringify(
          new ErrorResponse(
            HttpStatus.NON_AUTHORITATIVE_INFORMATION,
            error,
            this.getURL()
          )
        )}`
      );
      throw new HttpException(
        {
          status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
          error: error,
        },
        HttpStatus.NON_AUTHORITATIVE_INFORMATION
      );
    }
  }

  async connectWith(url: string, body: any): Promise<any> {
    try {
      const data = await firstValueFrom(
        this.httpService
          .post(url, body, this.options)
          .pipe(map((resp) => resp.data))
      );

      return data;
    } catch (error) {
      this.logger.error(
        `${JSON.stringify(
          new ErrorResponse(
            HttpStatus.NON_AUTHORITATIVE_INFORMATION,
            error,
            this.getURL()
          )
        )}`
      );
      throw new HttpException(
        {
          status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
          error: error,
        },
        HttpStatus.NON_AUTHORITATIVE_INFORMATION
      );
    }
  }


  async preConnect(action = "") {
    if (!this.actions.includes(action)) {
      return "The action does not exists";
    }
    const api = await this.getDataApi(action);
    if (api == 9404) {
      return `Not found the ${action} or data of API `;
    }
  }

  async postLogin(data: any): Promise<any> {
    return new Promise((resolve) => {
      data.subscribe(
        (res: any) => resolve(res),
        (err: any) => {
          this.logger.debug(
            `${ConnectService.name} is Logging error: ${JSON.stringify(err)}`
          );

          return err;
        }
      );
    });
  }

  bodyLogin(userName = "", gameType = 0) {
    this.setStart(Helper.getDate().yesterday);
    this.setEnd(Helper.getDate().today);
    const data = {
      userName,
      startTime: this.getStart(),
      endTime: this.getEnd(),
      gameType: gameType,
      sign: Helper.endCode(
        `${userName}|${this.getStart()}|${this.getEnd()}|${gameType}`
      ),
    };
    this.setBody(data);
  }

  bodyInfoFromToDate(
    userName: string,
    gameType: number,
    fromDate: Date,
    toDate: Date
  ) {
    if (!gameType) gameType = 0;
    const start = Helper.convertTime(fromDate);
    const end = Helper.convertTime(toDate);
    const data = {
      userName,
      startTime: start,
      endTime: end,
      gameType: gameType,
      sign: Helper.endCode(`${userName}|${start}|${end}|${gameType}`),
    };
    this.setBody(data);
  }

  async bodyUpdate(userName = "", awardAmount = 0, multiple = 0) {
    if (multiple == 0) {
      multiple = await this.getMultiple();
    }
    const data = {
      userName,
      awardAmount,
      multiple: multiple,
      remark: this.getRemark(),
      sign: Helper.endCode(`${userName}|${awardAmount}|${multiple}`),
    };
    this.setBody(data);
  }

  async getEventTime(isTest = 0) {
    if (isTest) {
      this.getConfig();
    }
    const data = await this.eventTimeRepository.find({
      where: {
        gameName: this.getGameName(),
        department: this.getDep(),
        isDeleted: 0,
      },
    });
    const firstItem = data.filter((x) => typeof x !== undefined).shift();
    if (!firstItem) {
      return 9404;
    }

    this.setStart(firstItem.start);
    this.setEnd(firstItem.end);

    return 9200;
  }

  async getDataApi(action = "", isTest = 0) {
    if (isTest) {
      this.getConfig();
    }
    const data = await this.apiRepository.find({
      where: {
        action,
        department: this.getDep(),
        isDeleted: 0,
        isActive: 1,
      },
    });
    const firstItem = data.filter((x) => typeof x !== undefined).shift();

    if (!firstItem) {
      return 9404;
    }

    this.setAction(firstItem?.action);
    this.setURL(firstItem?.api);

    return 9200;
  }

  getConfig() {
    const config = ConfigSys.config();

    if (!config) {
      return "Not found a configuration!";
    }
    this.setDep(config.department);
    this.setGameName(config.gameName);
    this.setMultiple(+config.multiple);
  }

  async checkUser(username = "") {
    const user = await this.userRepository.findOne({
      where: {
        username,
      },
    });
    if (user && !user?.role.includes(UserRoles.MEMBER)) {
      throw new ForbiddenException("Access Denied");
    }

    // if (!user) {
    //   const createUser = {
    //     username,
    //     role: UserRoles.MEMBER,
    //     password: this.password,
    //     isBlocked: false,
    //   };
    //   const createdUser = await this.userRepository.create(createUser);
    //   await this.userRepository.save(createdUser);
    //   this.logger.debug(`${ConnectService.name} create user: OK}`);
    // }
  }

  async checkUserVipInfo(userName = ""): Promise<string> {
    await this.compose(ConectEnum.LOGIN);

    const gameType = this.getGameType();

    for (const index in gameType) {
      this.bodyLogin(userName, gameType[index].type);
      const data = await this.connect();
      const isUser =
        Debug.typeOf(data?.code) === "Number" &&
        data?.code == 0 &&
        this.vips.includes(data?.data.level);
      if (isUser) return data?.data.level;
      return null;
    }
  }

  getGameType() {
    return [
      {
        type: GameTypeEnum.NO_HU,
        name: NameGamTypeEnum.NO_HU,
      },
      {
        type: GameTypeEnum.GAME_VIET,
        name: NameGamTypeEnum.GAME_VIET,
      },
      {
        type: GameTypeEnum.BAN_CA,
        name: NameGamTypeEnum.BAN_CA,
      },
      {
        type: GameTypeEnum.CASINO,
        name: NameGamTypeEnum.CASINO,
      },
      {
        type: GameTypeEnum.THE_THAO,
        name: NameGamTypeEnum.THE_THAO,
      },
    ];
  }
}
