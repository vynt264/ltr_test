import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, startOfDay } from "date-fns";
import { PaginationQueryDto } from "../../common/common.dto";
import {
  ErrorResponse,
  SuccessResponse,
} from "../../system/BaseResponse/index";
import { ERROR, MESSAGE, ORDER_STATUS, Order, STATUSCODE } from "../../system/constants";
import { Between, Like, Repository } from "typeorm";
import { Logger } from "winston";
import { CreateUserInfoDto, UpdateUserInfoDto } from "./dto/index";
import { UserInfo } from "./user.info.entity";
import { UserService } from "../user/user.service";
import { ConnectService } from "../connect/connect.service";
import { UploadS3Service } from "../upload.s3/upload.s3.service";
import { ConfigSys } from "src/common/helper";
import { OrdersService } from "../orders/orders.service";
import { PlayHistoryHilo } from "../admin/admin.hilo/entities/play.history.hilo.entity";
import { PlayHistoryPoker } from "../admin/admin.poker/entities/play.history.poker.entity";
@Injectable()
export class UserInfoService { 

  constructor(
    @InjectRepository(UserInfo)
    private userInfoRepository: Repository<UserInfo>,
    @InjectRepository(PlayHistoryHilo)
    private playHistoryHiloRepository: Repository<PlayHistoryHilo>,
    @InjectRepository(PlayHistoryPoker)
    private playHistoryPokerRepository: Repository<PlayHistoryPoker>,
    @Inject("winston")
    private readonly logger: Logger,
    private userService: UserService,
    private connectService: ConnectService,
    private uploadS3Service: UploadS3Service,
    private ordersService: OrdersService,
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

      let orders: any[] = []
      const paginationDto: any = {
        take: 100,
        skip: 1,
        order: Order.DESC,
      }
      const listOrderRes = await this.ordersService.findAll(paginationDto, {
        status: ORDER_STATUS.closed,
        id: userId,
      });
      if (listOrderRes?.lastPage == 1) {
        orders = listOrderRes.data;
      } else if (listOrderRes?.lastPage > 1) {
        for (let i = 2; i <= listOrderRes?.lastPage; i++) {
          const pagingDto: any = {
            take: 100,
            skip: i,
            order: Order.DESC,
          }
          const listOrderResPage = await this.ordersService.findAll(pagingDto, {
            id: userId,
          });
          orders = orders.concat(listOrderResPage.data);
        }
      } else {
        orders = [];
      }

      if (orders?.length > 0) {
        let sumBet = 0,
          sumOrder = 0,
          sumOrderWin = 0,
          sumOrderLose = 0,
          favoriteGame = "";
        let listFv: any[] = [];
        const listOrder = orders;
        listOrder?.map((order: any) => {
          sumBet += Number(order?.revenue);
          if (order?.paymentWin > 0) {
            sumOrderWin += 1; 
          } else if (order?.paymentWin < 0) {
            sumOrderLose += 1
          }
          const itemFv = {
            type: `${order?.type}${order?.seconds}s`,
            bet: order?.revenue
          }
          listFv.push(itemFv);
        });
        sumOrder = listOrderRes?.total;

        listFv = listFv.reduce((accumulator: any, currentValue: any) => {
          const { type, bet } = currentValue;
          if (!accumulator[type]) {
            accumulator[type] = { type, bet: 0 };
          }
          accumulator[type].bet += Number(bet);
          return accumulator;
        }, {});
        favoriteGame = JSON.stringify(Object.values(listFv));

        userInfo = {
          ...userInfo,
          sumBet,
          sumOrder,
          sumOrderLose,
          sumOrderWin,
          favoriteGame,
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

  async getByUserIdOrinals(userId: number): Promise<any> {
    try {
      let userInfo = await this.userInfoRepository.findOne({
        where: {
          user: {
            id: userId
          }
        }
      });

      let orders: any[] = [];
      let listFv: any[] = [];
      let sumBet = 0,
        sumOrder = 0,
        sumOrderWin = 0,
        sumOrderLose = 0,
        favoriteGame = "";
      const paginationDto: any = {
        take: 100,
        skip: 1,
        order: Order.DESC,
      }
      const skip =
        +paginationDto.take * +paginationDto?.skip - +paginationDto.take;
      // get hilo
      const resultHilo = await this.playHistoryHiloRepository.findAndCount({
        where: [
          {
            userId: userId,
          }
        ],
        order: { id: paginationDto.order },
        take: paginationDto.take,
        skip: skip
      });
      const lastPageHilo = Math.ceil(resultHilo[1] / paginationDto.take);
      if (resultHilo[1] <= paginationDto.take) {
        orders = resultHilo[0];
      } else if (resultHilo[1] > paginationDto.take) {
        for (let i = 1; i <= lastPageHilo; i++) {
          const pagingDto: any = {
            take: 100,
            skip: i,
            order: Order.DESC,
          }
          const skipNext = +pagingDto.take * +pagingDto?.skip - +pagingDto.take;
          const listOrderResPage =
            await this.playHistoryHiloRepository.findAndCount({
              where: [
                {
                  userId: userId,
                }
              ],
              order: { id: pagingDto.order },
              take: pagingDto.take,
              skip: skipNext
            });
          orders = orders.concat(listOrderResPage[0]);
        }
      }
      if (orders?.length > 0) {
        const listOrder = orders;
        listOrder?.map((order: any) => {
          sumBet += Number(order?.revenue);
          if (order?.totalPaymentWin > 0) {
            sumOrderWin += 1; 
          } else {
            sumOrderLose += 1
          }
          const itemFv = {
            type: `Hilo`,
            bet: order?.revenue
          }
          listFv.push(itemFv);
        });
        sumOrder += resultHilo[1];
      }
      // get poker
      orders = [];
      const resultPoker = await this.playHistoryPokerRepository.findAndCount({
        where: [
          {
            userId: userId,
          }
        ],
        order: { id: paginationDto.order },
        take: paginationDto.take,
        skip: skip
      });
      const lastPagePoker = Math.ceil(resultPoker[1] / paginationDto.take);
      if (resultPoker[1] <= paginationDto.take) {
        orders = resultPoker[0];
      } else if (resultPoker[1] > paginationDto.take) {
        for (let i = 1; i <= lastPagePoker; i++) {
          const pagingDto: any = {
            take: 100,
            skip: i,
            order: Order.DESC,
          }
          const skipNext = +pagingDto.take * +pagingDto?.skip - +pagingDto.take;
          const listOrderResPage =
            await this.playHistoryPokerRepository.findAndCount({
              where: [
                {
                  userId: userId,
                }
              ],
              order: { id: pagingDto.order },
              take: pagingDto.take,
              skip: skipNext
            });
          orders = orders.concat(listOrderResPage[0]);
        }
      }
      if (orders?.length > 0) {
        const listOrder = orders;
        listOrder?.map((order: any) => {
          sumBet += Number(order?.revenue);
          if (order?.paymentWin > 0) {
            sumOrderWin += 1; 
          } else {
            sumOrderLose += 1
          }
          const itemFv = {
            type: `Poker`,
            bet: order?.revenue
          }
          listFv.push(itemFv);
        });
        sumOrder += resultPoker[1];
      }

      if (orders?.length > 0) {
        listFv = listFv.reduce((accumulator: any, currentValue: any) => {
          const { type, bet } = currentValue;
          if (!accumulator[type]) {
            accumulator[type] = { type, bet: 0 };
          }
          accumulator[type].bet += Number(bet);
          return accumulator;
        }, {});
        favoriteGame = JSON.stringify(Object.values(listFv));

        userInfo = {
          ...userInfo,
          sumBet,
          sumOrder,
          sumOrderLose,
          sumOrderWin,
          favoriteGame,
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

  async updateAvatar(id: number, updateAvatarDto: any): Promise<any> {
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

      if (updateAvatarDto) {
        foundUserInfo = {
          ...foundUserInfo,
          avatar: updateAvatarDto?.avatar,
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

  async getDetailStatiscal(category: string, member: any) {
    try {
      let orders: any[] = []

      if (category == "all" || category == "xoso") {
        const paginationDto: any = {
          take: 100,
          skip: 1,
          order: Order.DESC,
        }
        const listOrderRes = await this.ordersService.findAll(paginationDto, {
          id: member?.id,
        });
        if (listOrderRes?.lastPage == 1) {
          orders = listOrderRes.data;
        } else if (listOrderRes?.lastPage > 1) {
          for (let i = 2; i <= listOrderRes?.lastPage; i++) {
            const pagingDto: any = {
              take: 100,
              skip: i,
              order: Order.DESC,
            }
            const listOrderResPage = await this.ordersService.findAll(
              pagingDto,
              { id: member?.id }
            );
            orders = orders.concat(listOrderResPage.data);
          }
        } else {
          orders = [];
        }
        if (orders?.length > 0) {
          let listFv: any[] = [];
          const listOrder = orders;
          listOrder?.map((order: any) => {
            const itemFv = {
              type: `${order?.type}${order?.seconds}s`,
              bet: order?.revenue,
              orderWin: order?.paymentWin > 0 ? 1 : 0,
              sumOrder: 1,
            }
            listFv.push(itemFv);
          });
          listFv = listFv.reduce((accumulator: any, currentValue: any) => {
            const { type, bet, orderWin, sumOrder } = currentValue;
            if (!accumulator[type]) {
              accumulator[type] = { type, bet: 0, orderWin: 0, sumOrder: 0 };
            }
            accumulator[type].bet += Number(bet);
            accumulator[type].orderWin += Number(orderWin);
            accumulator[type].sumOrder += Number(sumOrder);
            return accumulator;
          }, {});
          orders = Object.values(listFv);
        }
      } else {
        // to go category != "xoso"
      }

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        orders,
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

  async getDetailStatiscalOri(category: string, member: any) {
    try {
      let orders: any[] = [];
      let listFv: any[] = [];

      if (category == "all") {
        const paginationDto: any = {
          take: 100,
          skip: 1,
          order: Order.DESC,
        }
        const skip =
          +paginationDto.take * +paginationDto?.skip - +paginationDto.take;
        // get hilo
        const resultHilo = await this.playHistoryHiloRepository.findAndCount({
          where: [
            {
              userId: member?.id,
              bookmakerId: member?.bookmakerId
            }
          ],
          order: { id: paginationDto.order },
          take: paginationDto.take,
          skip: skip
        });
        const lastPageHilo = Math.ceil(resultHilo[1] / paginationDto.take);
        if (resultHilo[1] <= paginationDto.take) {
          orders = resultHilo[0];
        } else if (resultHilo[1] > paginationDto.take) {
          for (let i = 1; i <= lastPageHilo; i++) {
            const pagingDto: any = {
              take: 100,
              skip: i,
              order: Order.DESC,
            }
            const skipNext = 
              +pagingDto.take * +pagingDto?.skip - +pagingDto.take;
            const listOrderResPage =
              await this.playHistoryHiloRepository.findAndCount({
                where: [
                  {
                    userId: member?.id,
                    bookmakerId: member?.bookmakerId
                  }
                ],
                order: { id: pagingDto.order },
                take: pagingDto.take,
                skip: skipNext
              });
            orders = orders.concat(listOrderResPage[0]);
          }
        }
        if (orders?.length > 0) {
          const listOrder = orders;
          listOrder?.map((order: any) => {
            const itemFv = {
              type: `Hilo`,
              bet: Number(order?.revenue),
              orderWin: Number(order?.totalPaymentWin) > 0 ? 1 : 0,
              sumOrder: 1,
            }
            listFv.push(itemFv);
          });
        }
        // get poker
        orders = [];
        const resultPoker = await this.playHistoryPokerRepository.findAndCount({
          where: [
            {
              userId: member?.id,
              bookmakerId: member?.bookmakerId
            }
          ],
          order: { id: paginationDto.order },
          take: paginationDto.take,
          skip: skip
        });
        const lastPagePoker = Math.ceil(resultPoker[1] / paginationDto.take);
        if (resultPoker[1] <= paginationDto.take) {
          orders = resultPoker[0];
        } else if (resultPoker[1] > paginationDto.take) {
          for (let i = 1; i <= lastPagePoker; i++) {
            const pagingDto: any = {
              take: 100,
              skip: i,
              order: Order.DESC,
            }
            const skipNext = 
              +pagingDto.take * +pagingDto?.skip - +pagingDto.take;
            const listOrderResPage =
              await this.playHistoryPokerRepository.findAndCount({
                where: [
                  {
                    userId: member?.id,
                    bookmakerId: member?.bookmakerId
                  }
                ],
                order: { id: pagingDto.order },
                take: pagingDto.take,
                skip: skipNext
              });
            orders = orders.concat(listOrderResPage[0]);
          }
        }
        if (orders?.length > 0) {
          const listOrder = orders;
          listOrder?.map((order: any) => {
            const itemFv = {
              type: `Poker`,
              bet: Number(order?.revenue),
              orderWin: Number(order?.paymentWin) > 0 ? 1 : 0,
              sumOrder: 1,
            }
            listFv.push(itemFv);
          });
        }
      } else if (category == "hilo") {
        const paginationDto: any = {
          take: 100,
          skip: 1,
          order: Order.DESC,
        }
        const skip =
          +paginationDto.take * +paginationDto?.skip - +paginationDto.take;
        // get hilo
        const resultHilo = await this.playHistoryHiloRepository.findAndCount({
          where: [
            {
              userId: member?.id,
              bookmakerId: member?.bookmakerId
            }
          ],
          order: { id: paginationDto.order },
          take: paginationDto.take,
          skip: skip
        });
        const lastPageHilo = Math.ceil(resultHilo[1] / paginationDto.take);
        if (resultHilo[1] <= paginationDto.take) {
          orders = resultHilo[0];
        } else if (resultHilo[1] > paginationDto.take) {
          for (let i = 1; i <= lastPageHilo; i++) {
            const pagingDto: any = {
              take: 100,
              skip: i,
              order: Order.DESC,
            }
            const skipNext = 
              +pagingDto.take * +pagingDto?.skip - +pagingDto.take;
            const listOrderResPage =
              await this.playHistoryHiloRepository.findAndCount({
                where: [
                  {
                    userId: member?.id,
                    bookmakerId: member?.bookmakerId
                  }
                ],
                order: { id: pagingDto.order },
                take: pagingDto.take,
                skip: skipNext
              });
            orders = orders.concat(listOrderResPage[0]);
          }
        }
        if (orders?.length > 0) {
          const listOrder = orders;
          listOrder?.map((order: any) => {
            const itemFv = {
              type: `Hilo`,
              bet: Number(order?.revenue),
              orderWin: Number(order?.totalPaymentWin) > 0 ? 1 : 0,
              sumOrder: 1,
            }
            listFv.push(itemFv);
          });
        }
      } else if (category == "poker") {
        const paginationDto: any = {
          take: 100,
          skip: 1,
          order: Order.DESC,
        }
        const skip =
          +paginationDto.take * +paginationDto?.skip - +paginationDto.take;
        
        const resultPoker = await this.playHistoryPokerRepository.findAndCount({
          where: [
            {
              userId: member?.id,
              bookmakerId: member?.bookmakerId
            }
          ],
          order: { id: paginationDto.order },
          take: paginationDto.take,
          skip: skip
        });
        const lastPagePoker = Math.ceil(resultPoker[1] / paginationDto.take);
        if (resultPoker[1] <= paginationDto.take) {
          orders = resultPoker[0];
        } else if (resultPoker[1] > paginationDto.take) {
          for (let i = 1; i <= lastPagePoker; i++) {
            const pagingDto: any = {
              take: 100,
              skip: i,
              order: Order.DESC,
            }
            const skipNext = 
              +pagingDto.take * +pagingDto?.skip - +pagingDto.take;
            const listOrderResPage =
              await this.playHistoryPokerRepository.findAndCount({
                where: [
                  {
                    userId: member?.id,
                    bookmakerId: member?.bookmakerId
                  }
                ],
                order: { id: pagingDto.order },
                take: pagingDto.take,
                skip: skipNext
              });
            orders = orders.concat(listOrderResPage[0]);
          }
        }
        if (orders?.length > 0) {
          const listOrder = orders;
          listOrder?.map((order: any) => {
            const itemFv = {
              type: `Poker`,
              bet: Number(order?.revenue),
              orderWin: Number(order?.paymentWin) > 0 ? 1 : 0,
              sumOrder: 1,
            }
            listFv.push(itemFv);
          });
        }
      }

      listFv = listFv.reduce((accumulator: any, currentValue: any) => {
        const { type, bet, orderWin, sumOrder } = currentValue;
        if (!accumulator[type]) {
          accumulator[type] = { type, bet: 0, orderWin: 0, sumOrder: 0 };
        }
        accumulator[type].bet += Number(bet);
        accumulator[type].orderWin += Number(orderWin);
        accumulator[type].sumOrder += Number(sumOrder);
        return accumulator;
      }, {});
      orders = Object.values(listFv);

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        orders,
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
}