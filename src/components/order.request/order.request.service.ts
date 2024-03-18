// import { Inject, Injectable } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { endOfDay, format, startOfDay } from "date-fns";
// import { Helper } from "src/common/helper";
// import { getMapByValueAndKey } from "src/system/utilities/enum";
// import { Between, Repository } from "typeorm";
// import { Logger } from "winston";
// import { PaginationQueryDto } from "../../common/common.dto";
// import {
//   BaseResponse,
//   ErrorResponse,
//   SuccessResponse,
// } from "../../system/BaseResponse/index";
// import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
// import { ConnectService } from "../connect/connect.service";
// import { RateCaculation, TypeCaculation } from "../lottery.request/enums/status.dto";
// import { PrefixEnum, StatusSend } from "../sys.config/enums/sys.config.enum";
// import { UserRoles } from "../user/enums/user.enum";
// import { User } from "../user/user.entity";
// import { CancelOrderRequestDto } from "./dto/cancel.dto";
// import { ListOrderRequestDto } from "./dto/create.list.dto";
// import { CreateOrderRequestDto, UpdateOrderRequestDto } from "./dto/index";
// import { ListPaymentRequestDto } from "./dto/list.payment.request";
// import { PaymentRequestDto } from "./dto/payment.request";
// import { PaymentMethod, PointsEarnMethod, RefundMethod, StatusOrderRequest, TransactionType, TypeLotteryRequest } from "./enums/status.dto";
// import { OrderCodeQueue } from "./order.code.queue";
// import { OrderRequest } from "./order.request.entity";
// import { OrderRequestHis } from "./order.request.his.entity";
// import { CreateLotteryAwardDto } from "../lottery.award/dto";
// import { convertOrderDetail } from "../lottery.award/lottery.award.service";
// import { ValueDto } from "../lottery.request/dto/request.value.dto";
// @Injectable()
// export class OrderRequestService {


//   private mapBetTypeAndRate = new Map();

//   constructor(
//     @InjectRepository(OrderRequest)
//     private orderRequestRepository: Repository<OrderRequest>,
//     @InjectRepository(OrderRequestHis)
//     private orderRequestHisRepository: Repository<OrderRequestHis>,
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//     @InjectRepository(OrderCodeQueue)
//     private orderCodeQueueRepository: Repository<OrderCodeQueue>,
//     private connectService: ConnectService,
//     @Inject("winston")
//     private readonly logger: Logger
//   ) {
//     this.mapBetTypeAndRate = getMapByValueAndKey(RateCaculation, TypeCaculation)
//   }

//   async userGetAll(
//     paginationQueryDto: PaginationQueryDto,
//     user: any = null
//   ): Promise<BaseResponse> {
//     try {
//       const object: any = JSON.parse(paginationQueryDto.keyword);

//       const OrderRequests = await this.userSearchByOrderRequest(
//         paginationQueryDto,
//         object,
//         user
//       );

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         OrderRequests,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         MESSAGE.LIST_FAILED
//       );
//     }
//   }

//   async adminGetAll(
//     paginationQueryDto: PaginationQueryDto,
//   ): Promise<BaseResponse> {
//     try {
//       const object: any = JSON.parse(paginationQueryDto.keyword);

//       const OrderRequests = await this.adminSearchByOrderRequest(
//         paginationQueryDto,
//         object,
//       );

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         OrderRequests,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         MESSAGE.LIST_FAILED
//       );
//     }
//   }

//   async userSearchByOrderRequest(
//     paginationQuery: PaginationQueryDto,
//     OrderRequestDto: any,
//     user: any = null
//   ) {
//     const { error, member } = await this.getRoleById(user.id);

//     if (error) return error;

//     const { take: perPage, skip: page } = paginationQuery;
//     if (page <= 0) {
//       return "The skip must be more than 0";
//     }
//     const skip = +perPage * +page - +perPage;
//     const searching = await this.orderRequestRepository.findAndCount({
//       select: {
//         betType: true,
//         createdAt: true,
//         createdBy: true,
//         description: true,
//         detail: true,
//         id: true,
//         isExpired: true,
//         orderCode: true,
//         paymentWin: true,
//         revenue: true,
//         status: true,
//         turnIndex: true,
//         type: true,
//         updatedAt: true,
//         updatedBy: true,
//         isNoti: true,
//       },
//       where: this.userHoldQuery(OrderRequestDto, member),
//       take: +perPage,
//       skip,
//       order: { createdAt: paginationQuery.order },
//     });
//     return searching;
//   }

//   async adminSearchByOrderRequest(
//     paginationQuery: PaginationQueryDto,
//     OrderRequestDto: any,
//     user: any = null
//   ) {
//     const { take: perPage, skip: page } = paginationQuery;
//     if (page <= 0) {
//       return "The skip must be more than 0";
//     }
//     const skip = +perPage * +page - +perPage;
//     const searching = await this.orderRequestRepository.findAndCount({
//       relations: ["user"],
//       select: {
//         betType: true,
//         createdAt: true,
//         createdBy: true,
//         description: true,
//         detail: true,
//         id: true,
//         isExpired: true,
//         orderCode: true,
//         paymentWin: true,
//         revenue: true,
//         status: true,
//         turnIndex: true,
//         type: true,
//         updatedAt: true,
//         updatedBy: true,
//         isNoti: true,
//         user: {
//           id: true,
//           username: true,
//         }
//       },
//       where: this.adminHoldQuery(OrderRequestDto),
//       take: +perPage,
//       skip,
//       order: { createdAt: paginationQuery.order },
//     });
//     return searching;
//   }

//   userHoldQuery(object: any = null, member: any = null) {
//     const data: any = {};
//     data.user = { id: member.id }
//     if (!object) return data;

//     for (const key in object) {
//       switch (key) {
//         case "type":
//           data.type = object.type;
//           break;
//         case "turnIndex":
//           data.turnIndex = object.turnIndex;
//           break;
//         case "status":
//           data.status = object.status;
//           break;
//         default:
//           break;
//       }

//       if (key === "startDate" || key === "endDate") {
//         let startDate = startOfDay(new Date(object.startDate));
//         let endDate = endOfDay(new Date(object.endDate));
//         data.createdAt = Between(startDate, endDate);
//       }
//     }
//     return data;
//   }

//   adminHoldQuery(object: any = null, member: any = null) {
//     const data: any = {};
//     if (!object) return data;

//     for (const key in object) {
//       switch (key) {
//         case "type":
//           data.type = object.type;
//           break;
//         case "turnIndex":
//           data.turnIndex = object.turnIndex;
//           break;
//         case "status":
//           data.status = object.status;
//           break;
//         case "username":
//           data.user = {
//             username: object.username
//           };
//           break;
//         default:
//           break;
//       }

//       if (key === "startDate" || key === "endDate") {
//         let startDate = startOfDay(new Date(object.startDate));
//         let endDate = endOfDay(new Date(object.endDate));
//         data.createdAt = Between(startDate, endDate);
//       }
//     }
//     return data;
//   }

//   async getRoleById(id: number): Promise<any> {
//     const member = await this.userRepository.findOne({
//       select: {
//         id: true,
//         isBlocked: true,
//       },
//       where: {
//         id,
//         role: UserRoles.MEMBER,
//         isBlocked: false,
//       },
//     });
//     if (!member) {
//       // TODO test
//       return {
//         error: new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           { message: `Not found userId ${id}` },
//           ERROR.USER_NOT_FOUND
//         ),
//       };
//     }

//     return { member };
//   }

//   async getOneById(id: number): Promise<BaseResponse> {
//     try {
//       const foundOrderRequest = await this.orderRequestRepository.findOneBy({ id });

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         foundOrderRequest,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_NOT_FOUND,
//         error,
//         ERROR.NOT_FOUND
//       );
//     }
//   }

//   async verifyUser(id: any): Promise<{ error: ErrorResponse; user: User }> {
//     const user = await this.userRepository.findOne({
//       select: {
//         id: true,
//         username: true,
//         isAuth: true,
//       },
//       where: {
//         id,
//       },
//     });
//     if (!user) {
//       return {
//         error: new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           { message: `Not found userId ${id}` },
//           ERROR.USER_NOT_FOUND
//         ),
//         user: null,
//       };
//     }

//     return { error: null, user };
//   }

//   async cancel(cancelRequestDto: CancelOrderRequestDto, member: User): Promise<BaseResponse> {
//     // TODO lock user cancel
//     // TODO xóa check từng loại xổ số theo thời gian
//     // try {
//     //   const { error, user } = await this.verifyUser(member.id);
//     //   if (error) return error;

//     //   const orderFound = await this.orderRequestRepository.findOneBy({ id: cancelRequestDto.id, user: { id: user.id } });

//     //   if (!orderFound) {
//     //     return new ErrorResponse(
//     //       STATUSCODE.COMMON_NOT_FOUND,
//     //       `order id ${cancelRequestDto.id} not found`,
//     //       ERROR.NOT_FOUND,
//     //     );
//     //   }

//     //   const turnIndex = this.getTurnIndex(orderFound.type, new Date());

//     //   if (orderFound.turnIndex != turnIndex) {
//     //     return new ErrorResponse(
//     //       STATUSCODE.TURN_INDEX_INVALID,
//     //       `turnIndex invalid`,
//     //       ERROR.CREATE_FAILED
//     //     );
//     //   }
//     //   // TODO lock
//     //   if (orderFound.status != +StatusOrderRequest.INIT_SUCCESS || orderFound.isExpired) {
//     //     return new ErrorResponse(
//     //       STATUSCODE.ORDER_STATUS_INVALID,
//     //       `order status ${orderFound.status} invalid`,
//     //       ERROR.NOT_FOUND,
//     //     );
//     //   }

//     //   orderFound.status = +StatusOrderRequest.CANCEL_DRAFT;
//     //   await this.orderRequestRepository.save(orderFound);
//     //   await this.orderRequestHisRepository.save({ ...orderFound, user: { id: user.id } });

//     //   const paymentRequest: PaymentRequestDto = {
//     //     amount: orderFound.revenue,
//     //     gameCode: null,
//     //     username: user.username,
//     //     transType: `${TransactionType.REFUND}`,
//     //     method: `${RefundMethod.WALLET_REFUND}`,
//     //     note: `${orderFound.type}-${orderFound.turnIndex}-${orderFound.betType}`,
//     //     signature: '',
//     //     transRef1: orderFound.orderCode,
//     //   }
//     //   const listOrderRequest = [];
//     //   const listPaymentRequest = [];

//     //   listOrderRequest.push(orderFound);
//     //   listPaymentRequest.push(paymentRequest);
//     //   const userPaymentRequest: ListPaymentRequestDto = {
//     //     payments: listPaymentRequest,
//     //     // TODO init signature
//     //     signature: '',
//     //   }

//     //   await this.processPaymentsFake(listOrderRequest, userPaymentRequest, +StatusOrderRequest.CANCEL_SUCCESS, +StatusOrderRequest.CANCEL_ERROR);

//     //   return new SuccessResponse(
//     //     STATUSCODE.COMMON_UPDATE_SUCCESS,
//     //     cancelRequestDto,
//     //     MESSAGE.UPDATE_SUCCESS
//     //   );
//     // } catch (error) {
//     //   this.logger.debug(
//     //     `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//     //   );
//     //   return new ErrorResponse(
//     //     STATUSCODE.COMMON_FAILED,
//     //     error,
//     //     ERROR.CREATE_FAILED
//     //   );
//     // }

//     return;
//   }

//   async processEarnListFake(orders: OrderRequest[]) {
//     const listPaymentRequest = [];
//     for (const orderFound of orders) {
//       const paymentRequest: PaymentRequestDto = {
//         amount: orderFound.revenue,
//         gameCode: null,
//         username: orderFound.user.username,
//         transType: `${TransactionType.POINTS_EARN}`,
//         method: `${PointsEarnMethod.WALLET_POINTS_EARN}`,
//         note: `${orderFound.type}-${orderFound.turnIndex}-${orderFound.betType}`,
//         signature: '',
//         transRef1: orderFound.orderCode,
//       }
//       listPaymentRequest.push(paymentRequest);
//     }

//     const userPaymentRequest: ListPaymentRequestDto = {
//       payments: listPaymentRequest,
//       // TODO init signature
//       signature: '',
//     }
//     await this.processPaymentsFake(orders, userPaymentRequest, +StatusOrderRequest.EARN_SUCCESS, +StatusOrderRequest.EARN_ERROR);
//   }

//   async orderRequestLoser(orders: OrderRequest[]) {
//     await this.orderRequestRepository.save(orders)
//   }

//   async create(listOrderRequestDto: ListOrderRequestDto, member: User): Promise<BaseResponse> {
//     try {

//       const { error, user } = await this.verifyUser(member.id);
//       if (error) return error;

//       for (const orderRequestDto of listOrderRequestDto.listOrder) {
//         const rate = this.mapBetTypeAndRate.get(orderRequestDto.betType);

//         if (!rate) {
//           return new ErrorResponse(
//             STATUSCODE.BET_TYPE_INVALID,
//             `Invalid bet type`,
//             ERROR.CREATE_FAILED
//           );
//         }
//         const orderRequestDraft = this.orderRequestRepository.create(orderRequestDto);
//         const { values, error } = convertOrderDetail(orderRequestDraft);

//         if (values.length == 0 || error) {
//           return new ErrorResponse(
//             STATUSCODE.INVALID_ORDER_DETAIL,
//             orderRequestDto,
//             ERROR.CREATE_FAILED
//           );
//         }

//         if (!this.validateRevenue(orderRequestDto.type, orderRequestDto.betType, orderRequestDto.revenue, values)) {
//           return new ErrorResponse(
//             STATUSCODE.INVALID_ORDER_REVENUE,
//             orderRequestDto,
//             ERROR.CREATE_FAILED
//           );
//         }
//       }

//       const listOrderRequest = [];
//       const listPaymentRequest = [];

//       for (const orderRequestDto of listOrderRequestDto.listOrder) {
//         // TODO
//         const turnIndex = this.getTurnIndex(orderRequestDto.type, new Date());

//         const newOrderRequest = {
//           user: { id: user.id },
//           status: +StatusOrderRequest.INIT_DRAFT,
//           revenue: orderRequestDto.revenue,
//           type: orderRequestDto.type,
//           turnIndex: turnIndex,
//           createdBy: user.username,
//           orderCode: await this.getOrderCode(),
//           betType: orderRequestDto.betType,
//           detail: orderRequestDto.detail,
//         };

//         const createdOrderRequest = this.orderRequestRepository.create(newOrderRequest);

//         const paymentRequest: PaymentRequestDto = {
//           amount: createdOrderRequest.revenue,
//           gameCode: null,
//           username: user.username,
//           transType: `${TransactionType.PAYMENT}`,
//           method: `${PaymentMethod.WALLET_MINI_GAME}`,
//           note: `${orderRequestDto.type}-${turnIndex}-${orderRequestDto.betType}`,
//           signature: '',
//           transRef1: createdOrderRequest.orderCode,
//         }

//         listOrderRequest.push(createdOrderRequest);
//         listPaymentRequest.push(paymentRequest);
//       }

//       const orders = await this.orderRequestRepository.save(listOrderRequest);
//       await this.orderRequestHisRepository.save(orders);

//       const userPaymentRequest: ListPaymentRequestDto = {
//         payments: listPaymentRequest,
//         // TODO init signature
//         signature: '',
//       }
//       await this.processPaymentsFake(orders, userPaymentRequest, +StatusOrderRequest.INIT_SUCCESS, +StatusOrderRequest.INIT_ERROR);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_CREATE_SUCCESS,
//         `successfully created`,
//         MESSAGE.CREATE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.UPDATE_FAILED
//       );
//     }
//   }

//   // TODO check tien
//   validateRevenue(type: string, betType: string, revenue: number, values: ValueDto[]) {
//     if (betType) {

//     }
//     return true;
//   }

//   async create45sFake(listOrderRequestDto: ListOrderRequestDto, member: User): Promise<BaseResponse> {
//     try {

//       const { error, user } = await this.verifyUser(member.id);
//       if (error) return error;
//       const turnIndex = this.getTurnIndex(`${TypeLotteryRequest.XSMB_45_S}`, new Date());
//       listOrderRequestDto.listOrder = [];

//       for (let i = 0; i < listOrderRequestDto.length; i++) {

//         let randomBetType = this.genRandom(0, 8);
//         let betType = '';

//         if (randomBetType == 1) {
//           betType = `${TypeCaculation.De_Dac_Biet}`;
//         } else if (randomBetType == 2) {
//           betType = `${TypeCaculation.De_Dau}`;
//         } else if (randomBetType == 3) {
//           betType = `${TypeCaculation.De_Dau_Duoi}`;
//         } else if (randomBetType == 4) {
//           betType = `${TypeCaculation.Lo_2_So}`;
//         } else if (randomBetType == 5) {
//           betType = `${TypeCaculation.Lo_2_So_1k}`;
//         } else if (randomBetType == 6) {
//           betType = `${TypeCaculation.Lo_3_So}`;
//         } else if (randomBetType == 7) {
//           betType = `${TypeCaculation.Lo_4_So}`;
//         } else {
//           betType = `${TypeCaculation.Lo_2_So_1k}`;
//         }

//         let detail = '';
//         if (betType == `${TypeCaculation.Lo_3_So}`) {
//           detail = `${this.genRandom(0, 9)}|${this.genRandom(0, 9)}|${this.genRandom(0, 9)}`;
//         } else if (betType == `${TypeCaculation.Lo_4_So}`) {
//           detail = `${this.genRandom(0, 9)}|${this.genRandom(0, 9)}|${this.genRandom(0, 9)}|${this.genRandom(0, 9)}`;
//         } else {
//           detail = `${this.genRandom(0, 9)},${this.genRandom(0, 9)}|${this.genRandom(0, 9)},${this.genRandom(0, 9)}`;

//         }
//         let revenue = this.genRandom(1, 1000);
//         if (betType == `${TypeCaculation.Lo_2_So}`) {
//           revenue = revenue * 18;
//         }
//         const requestOrder: CreateOrderRequestDto = {
//           betType,
//           detail,
//           revenue,
//           type: `${TypeLotteryRequest.XSMB_45_S}`,
//           turnIndex,
//           childBetType: '',
//         }
//         listOrderRequestDto.listOrder.push(requestOrder)
//       }

//       const listOrderRequest = [];
//       const listPaymentRequest = [];

//       for (const orderRequestDto of listOrderRequestDto.listOrder) {
//         const turnIndex = this.getTurnIndex(orderRequestDto.type, new Date());
//         const rate = this.mapBetTypeAndRate.get(orderRequestDto.betType);

//         const newOrderRequest = {
//           user: { id: user.id },
//           status: +StatusOrderRequest.INIT_DRAFT,
//           revenue: orderRequestDto.revenue,
//           type: orderRequestDto.type,
//           turnIndex,
//           createdBy: user.username,
//           orderCode: await this.getOrderCode(),
//           betType: orderRequestDto.betType,
//           detail: orderRequestDto.detail,
//         };

//         const createdOrderRequest = this.orderRequestRepository.create(newOrderRequest);

//         const paymentRequest: PaymentRequestDto = {
//           amount: createdOrderRequest.revenue,
//           gameCode: null,
//           username: user.username,
//           transType: `${TransactionType.PAYMENT}`,
//           method: `${PaymentMethod.WALLET_MINI_GAME}`,
//           note: `${orderRequestDto.type}-${turnIndex}-${orderRequestDto.betType}`,
//           signature: '',
//           transRef1: createdOrderRequest.orderCode,
//         }

//         listOrderRequest.push(createdOrderRequest);
//         listPaymentRequest.push(paymentRequest);
//       }

//       const orders = await this.orderRequestRepository.save(listOrderRequest);
//       await this.orderRequestHisRepository.save(orders);

//       const userPaymentRequest: ListPaymentRequestDto = {
//         payments: listPaymentRequest,
//         // TODO init signature
//         signature: '',
//       }
//       await this.processPaymentsFake(orders, userPaymentRequest, +StatusOrderRequest.INIT_SUCCESS, +StatusOrderRequest.INIT_ERROR);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_CREATE_SUCCESS,
//         `successfully created`,
//         MESSAGE.CREATE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.UPDATE_FAILED
//       );
//     }
//   }

//   async processPaymentsFake(orders: OrderRequest[], userPaymentRequest: ListPaymentRequestDto, statusSuccess: number, statusError: number) {
//     try {
//       const arrOrderResponse = await this.connectService.paymentFake(userPaymentRequest);
//       if (arrOrderResponse && arrOrderResponse instanceof Array) {

//         for (const order of orders) {
//           const orderResponse = arrOrderResponse.find(r => r.transRef1 === order.orderCode);
//           order.ft = orderResponse?.ft;

//           if (orderResponse && orderResponse?.status == `${StatusSend.SUCCESS}`) {
//             order.status = +statusSuccess;
//           } else {
//             order.status = +statusError;
//             order.description = orderResponse?.description;
//           }
//         }

//         await this.orderRequestRepository.save(orders);
//         await this.orderRequestHisRepository.save(orders);
//         return;
//       }

//       for (const order of orders) {
//         order.status = +statusError;
//         order.description = JSON.stringify(arrOrderResponse).length > 255 ? JSON.stringify(arrOrderResponse).slice(0, 255) : JSON.stringify(arrOrderResponse);
//       }

//       await this.orderRequestRepository.save(orders);
//       await this.orderRequestHisRepository.save(orders);

//     } catch (error) {
//       for (const order of orders) {
//         order.status = +statusError;
//         order.description = JSON.stringify(error).length > 255 ? JSON.stringify(error).slice(0, 255) : JSON.stringify(error);
//       }

//       await this.orderRequestRepository.save(orders);
//       await this.orderRequestHisRepository.save(orders);
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//     }
//   }

//   async processRefundListFake(orders: OrderRequest[]) {
//     const listPaymentRequest = [];
//     for (const orderFound of orders) {
//       const paymentRequest: PaymentRequestDto = {
//         amount: orderFound.revenue,
//         gameCode: null,
//         username: orderFound.user.username,
//         transType: `${TransactionType.REFUND}`,
//         method: `${RefundMethod.WALLET_REFUND}`,
//         note: `${orderFound.type}-${orderFound.turnIndex}-${orderFound.betType}`,
//         signature: '',
//         transRef1: orderFound.orderCode,
//       }
//       listPaymentRequest.push(paymentRequest);
//     }

//     const userPaymentRequest: ListPaymentRequestDto = {
//       payments: listPaymentRequest,
//       // TODO init signature
//       signature: '',
//     }

//     await this.processPaymentsFake(orders, userPaymentRequest, +StatusOrderRequest.REFUND_SUCCESS, +StatusOrderRequest.REFUND_ERROR);
//   }

//   async processEarn(user: User, orders: OrderRequest[], userPaymentRequest: ListPaymentRequestDto) {
//     try {
//       const arrOrderResponse = await this.connectService.paymentFake(userPaymentRequest);
//       if (arrOrderResponse && arrOrderResponse instanceof Array) {

//         for (const order of orders) {
//           const orderResponse = arrOrderResponse.find(r => r.transRef1 === order.orderCode);
//           order.ft = orderResponse?.ft;

//           if (orderResponse && orderResponse?.status == `${StatusSend.SUCCESS}`) {
//             order.status = +StatusOrderRequest.EARN_SUCCESS;
//           } else {
//             order.status = +StatusOrderRequest.EARN_ERROR;
//             order.description = orderResponse?.description;
//           }

//         }

//         await this.orderRequestRepository.save(orders);
//         await this.orderRequestHisRepository.save(orders);
//         return;
//       }

//       for (const order of orders) {
//         order.status = +StatusOrderRequest.EARN_ERROR;
//         order.description = JSON.stringify(arrOrderResponse).length > 255 ? JSON.stringify(arrOrderResponse).slice(0, 255) : JSON.stringify(arrOrderResponse);
//       }

//       await this.orderRequestRepository.save(orders);
//       await this.orderRequestHisRepository.save(orders);

//     } catch (error) {
//       for (const order of orders) {
//         order.status = +StatusOrderRequest.EARN_ERROR;
//         order.description = JSON.stringify(error).length > 255 ? JSON.stringify(error).slice(0, 255) : JSON.stringify(error);
//       }

//       await this.orderRequestRepository.save(orders);
//       await this.orderRequestHisRepository.save(orders);
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//     }
//   }

//   getTurnIndex(type: string, dateTime: Date) {

//     let turnIndex = '';
//     if (type == `${TypeLotteryRequest.XSMB}`) {
//       const xsmb = this.getNextTimeXsmb(dateTime);
//       turnIndex = xsmb.turnIndex;
//     } else if (type == `${TypeLotteryRequest.XSMB_45_S}`) {
//       const xsmb45s = this.getNextTimeXsmb45s(dateTime);
//       turnIndex = xsmb45s.turnIndex;
//     }

//     return turnIndex;
//   }

//   async getListOrders(createAwardDto: CreateLotteryAwardDto): Promise<OrderRequest[]> {
//     // chu y :select all column orderRequest
//     const orders = await this.orderRequestRepository.find({
//       relations: ["user"],
//       select: {
//         user: {
//           id: true,
//           username: true,
//           isAuth: true,
//         },
//         betType: true,
//         createdAt: true,
//         createdBy: true,
//         description: true,
//         detail: true,
//         ft: true,
//         id: true,
//         isExpired: true,
//         orderCode: true,
//         paymentWin: true,
//         revenue: true,
//         status: true,
//         turnIndex: true,
//         type: true,
//         updatedAt: true,
//         updatedBy: true,
//       },
//       where: {
//         isExpired: false,
//         type: createAwardDto.type,
//         turnIndex: createAwardDto.turnIndex,
//         status: +StatusOrderRequest.INIT_SUCCESS,
//       }
//     })

//     return orders;
//   }

//   async update(id: number, updateOrderRequestDto: UpdateOrderRequestDto): Promise<any> {
//     try {
//       let foundOrderRequest = await this.orderRequestRepository.findOneBy({
//         id,
//       });

//       if (!foundOrderRequest) {
//         return new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           `OrderRequest with id: ${id} not found!`,
//           ERROR.NOT_FOUND
//         );
//       }

//       foundOrderRequest = {
//         ...foundOrderRequest,
//         ...updateOrderRequestDto,
//         updatedAt: new Date(),
//       };
//       await this.orderRequestRepository.save(foundOrderRequest);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_UPDATE_SUCCESS,
//         foundOrderRequest,
//         MESSAGE.UPDATE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.UPDATE_FAILED
//       );
//     }
//   }

//   async delete(id: number): Promise<BaseResponse> {
//     try {
//       const foundOrderRequest = await this.orderRequestRepository.findOneBy({
//         id,
//       });

//       if (!foundOrderRequest) {
//         return new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           `OrderRequest with id: ${id} not found!`,
//           ERROR.NOT_FOUND
//         );
//       }
//       await this.orderRequestRepository.delete(id);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_DELETE_SUCCESS,
//         `OrderRequest has deleted id: ${id} success!`,
//         MESSAGE.DELETE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.DELETE_FAILED
//       );
//     }
//   }

//   getNextTimeXsmb45s(dateTime: Date) {
//     // TODO check next turn, khi sang ngay moi
//     const cycle = 45000;
//     const now = new Date(dateTime);
//     const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
//     const turn = Math.floor(minutesSinceMidnight / + cycle);
//     const turnIndex = format(now, 'dd/MM/yyyy') + '-' + turn;
//     return { turnIndex };
//   }

//   getNextTimeXsmb(dateTime: Date) {
//     const now = new Date(dateTime);
//     let turnIndex = null;
//     const time6h15 = (18 * 60 + 15 + 24 * 60) * 60000;
//     if (time6h15 > now.getTime()) {
//       turnIndex = format(new Date(now.getTime() + 24 * 60 * 60000), 'dd/MM/yyyy');
//     } else {
//       turnIndex = format(now, 'dd/MM/yyyy');
//     }

//     return { turnIndex: turnIndex };
//   }

//   async getOrderCode(): Promise<string> {
//     const ftQueue = await this.orderCodeQueueRepository.save({});
//     const ft =
//       PrefixEnum.LOTTTERY_ORDER +
//       Helper.formatDateToYYMMDD(new Date()) +
//       ftQueue.id.toString(16);

//     return ft;
//   }

//   genRandom(min: number, max: number): number {
//     const randomDecimal = Math.random();
//     const randomNumber = Math.floor(randomDecimal * (max - min + 1)) + min;
//     return randomNumber;
//   }

//   async userGetBalanceInfo(id = 0): Promise<any> {
//     try {
//       let balance = 0;
//       const user = await this.userRepository.findOne({
//         select: {
//           id: true,
//           name: true,
//           username: true,
//           option: true,
//           isAuth: true,
//         },
//         where: {
//           id: id,
//           isDeleted: false,
//           isBlocked: false,
//         },
//       });

//       if (!user) {
//         return new ErrorResponse(
//           STATUSCODE.USER_NOT_FOUND,
//           `user not found`,
//           ERROR.NOT_FOUND
//         );
//       }

//       // TODO
//       // if (user.isAuth) {
//       //   const dataResponse = await this.connectService.getBalanceUseNotAuth(user.username);
//       // } else {
//       //   const dataResponse = await this.connectService.getBalanceUseNotAuth(user.username);
//       // }
//       const dataResponse = await this.connectService.getBalanceUseNotAuth(user.username);
//       balance = dataResponse?.data?.result?.wallet?.availableBalance;

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         { balance: +balance },
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_NOT_FOUND,
//         error,
//         ERROR.NOT_FOUND
//       );
//     }
//   }

//   async deleteDataFake(usernameFake: string): Promise<BaseResponse> {
//     try {
//       const userFind = await this.userRepository.findOne({
//         where: {
//           username: usernameFake,
//         }
//       })

//       if (userFind) {
//         const listOrderFake = await this.orderRequestRepository.find({
//           where: {
//             user: {
//               id: userFind?.id
//             }
//           }
//         });
//         if (listOrderFake?.length > 0) {
//           listOrderFake.map(async (order) => {
//             await this.orderRequestRepository.delete(order?.id);
//           })
//         }

//         const listOrderHisFake = await this.orderRequestHisRepository.find({
//           where: {
//             user: {
//               id: userFind?.id
//             }
//           }
//         });
//         if (listOrderHisFake?.length > 0) {
//           listOrderHisFake.map(async (order) => {
//             await this.orderRequestHisRepository.delete(order?.id);
//           })
//         }

//         await this.userRepository.delete(userFind?.id);
//       }

//       return new SuccessResponse(
//         STATUSCODE.COMMON_DELETE_SUCCESS,
//         `Data fake delete success!`,
//         MESSAGE.DELETE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.DELETE_FAILED
//       );
//     }
//   }

//   async getAllOrderUserInfo(username: string): Promise<BaseResponse> {
//     try {
//       const userFind = await this.userRepository.findOne({
//         where: {
//           username: username,
//         }
//       })

//       const listOrder = await this.orderRequestRepository.findAndCount({
//         where: {
//           user: {
//             id: userFind?.id
//           }
//         }
//       })
//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         listOrder,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${OrderRequestService.name} is Logging error: ${JSON.stringify(error)}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.NOT_FOUND
//       );
//     }
//   }
// }
