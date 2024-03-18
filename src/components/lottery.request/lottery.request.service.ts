// import { Inject, Injectable } from "@nestjs/common";
// import { InjectRepository } from "@nestjs/typeorm";
// import { endOfDay, format, startOfDay } from "date-fns";
// import { Between, Repository } from "typeorm";
// import { Logger } from "winston";
// import { PaginationQueryDto } from "../../common/common.dto";
// import {
//   BaseResponse,
//   ErrorResponse,
//   SuccessResponse,
// } from "../../system/BaseResponse/index";
// import { ERROR, MESSAGE, STATUSCODE } from "../../system/constants";
// import { TypeLottery } from "../lottery.award/enums/status.dto";
// import { LotteryAward } from "../lottery.award/lottery.award.entity";
// import { PrefixEnum, StatusSend } from "../sys.config/enums/sys.config.enum";
// import { UserRoles } from "../user/enums/user.enum";
// import { User } from "../user/user.entity";
// import { BaseGiaiDto } from "./dto/base2so.dto";
// import { UpdateLotteryRequestDto } from "./dto/index";
// import { FullInfoAward, MatriGiaiDto } from "./dto/matric.giai.dto";
// import { RequestDetailDto as LotteryRequestDetailDto } from "./dto/request.detail.dto";
// import { ValueDto } from "./dto/request.value.dto";
// import {
//   LotteryInfo,
//   MatricGiai,
//   MatricInt,
//   RateCaculation,
// } from "./enums/status.dto";
// import { LotteryFtQueue } from "./lottery.ft.queue";
// import { LotteryRequest } from "./lottery.request.entity";
// import { SubAwardDto } from "./dto/sub.award.dto";
// @Injectable()
// export class LotteryRequestService {

//   private loop3And4Length = 10;
//   private loopPrefix = 100;

//   constructor(
//     @InjectRepository(LotteryRequest)
//     private lotteryRequestRepository: Repository<LotteryRequest>,
//     @InjectRepository(LotteryFtQueue)
//     private lotteryFtRepository: Repository<LotteryFtQueue>,
//     @InjectRepository(LotteryAward)
//     private lotteryAwardRepository: Repository<LotteryAward>,
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//     @Inject("winston")
//     private readonly logger: Logger
//   ) { }

//   async getAll(
//     paginationQueryDto: PaginationQueryDto,
//     user: any = null
//   ): Promise<BaseResponse> {
//     try {
//       const object: any = JSON.parse(paginationQueryDto.keyword);

//       const LotteryRequests = await this.searchByLotteryRequest(
//         paginationQueryDto,
//         object,
//         user
//       );

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         LotteryRequests,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${LotteryRequestService.name} is Logging error: ${JSON.stringify(
//           error
//         )}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         MESSAGE.LIST_FAILED
//       );
//     }
//   }

//   async searchByLotteryRequest(
//     paginationQuery: PaginationQueryDto,
//     lotteryRequestDto: any,
//     user: any = null
//   ) {
//     const { take: perPage, skip: page } = paginationQuery;
//     if (page <= 0) {
//       return "The skip must be more than 0";
//     }
//     const skip = +perPage * +page - +perPage;
//     const searching = await this.lotteryRequestRepository.findAndCount({
//       where: this.holdQuery(lotteryRequestDto, null),
//       take: +perPage,
//       skip,
//       order: { createdAt: paginationQuery.order },
//     });

//     return searching;
//   }

//   holdQuery(object: any = null, member: any = null) {
//     const data: any = {};
//     // if (member) {
//     //   data.user = { id: member.id };
//     //   if (!object) return data;
//     //   for (const key in object) {
//     //     switch (key) {
//     //       case "typeSearch":
//     //         data.type = object.type;
//     //         break;
//     //       default:
//     //         break;
//     //     }

//     //     if (key === "startDate" || key === "endDate") {
//     //       const startDate = new Date(object.startDate);
//     //       const endDate = new Date(object.endDate);
//     //       data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
//     //     }
//     //   }
//     // } else {
//     if (!object) return data;

//     for (const key in object) {
//       switch (key) {
//         case "transRef1":
//           data.transRef1 = object.transRef1;
//           break;
//         case "ft":
//           data.ft = object.ft;
//           break;
//         case "turnIndex":
//           data.turnIndex = object.turnIndex;
//           break;
//         case "type":
//           data.type = object.type;
//           break;
//         default:
//           break;
//       }

//       if (key === "startDate" || key === "endDate") {
//         const startDate = new Date(object.startDate);
//         const endDate = new Date(object.endDate);
//         data.createdAt = Between(startOfDay(startDate), endOfDay(endDate));
//       }
//     }
//     // }
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
//       const foundLotteryRequest = await this.lotteryRequestRepository.findOneBy(
//         { id }
//       );

//       return new SuccessResponse(
//         STATUSCODE.COMMON_SUCCESS,
//         foundLotteryRequest,
//         MESSAGE.LIST_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${LotteryRequestService.name} is Logging error: ${JSON.stringify(
//           error
//         )}`
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

//   getTurnIndex(type: string): string {
//     const now = new Date(new Date().getTime() - 5000);
//     const formattedDate = format(now, "dd/MM/yyyy");
//     let turnIndex = "";
//     if (type == `${TypeLottery.XSMB}`) {
//       turnIndex = formattedDate;
//     } else if (type == `${TypeLottery.XSMB_45_S}`) {
//       const cycle = 45000;
//       const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
//       const turn = Math.floor(minutesSinceMidnight / +cycle);
//       turnIndex = formattedDate + "-" + turn;
//     } else if (type == `${TypeLottery.XSN_TEST}`) {
//       turnIndex = formattedDate + "-" + now.getTime();
//     } else if (type == `${TypeLottery.XSN_TEST}`) {
//       turnIndex =
//         formattedDate + "-" + now.getTime() + "-" + this.genRandom(0, 9999);
//     }

//     return turnIndex;
//   }

//   getOpenTime(type: string): Date {
//     if (type == `${TypeLottery.XSN_TEST}`) {
//       return new Date();
//     }

//     if (type == `${TypeLottery.XSMB_45_S}`) {
//       return this.getTimeXsmb45s();
//     }

//     return new Date();
//   }

//   getTimeXsmb45s() {
//     const cycle = 45000;
//     const now = new Date();
//     const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
//     const nextTurn = Math.floor(minutesSinceMidnight / +cycle);

//     return new Date(startOfDay(now).getTime() + cycle * nextTurn);
//   }

//   getArrAwardInt(
//     createRequestDto: LotteryRequestDetailDto,
//     lotteryInfo: LotteryInfo
//   ) {
//     const matricGiai = this.initMatricGiai(lotteryInfo);
//     // TODO: for giải lo, giải đặc biêt
//     let awardAndRate = [];

//     for (let i = 0; i < 5; i++) {
//       const { error, arrAwardInt, rate, totalPay, listAward, arrAwardStr } =
//         this.genRandomArrAwardInt(
//           createRequestDto,
//           lotteryInfo,
//           matricGiai,
//           true
//         );
//       if (!error && rate >= 0.05 && rate < 1) {
//         awardAndRate.push({ arrAwardInt, rate, totalPay, listAward, arrAwardStr });
//       }
//     }
//     if (awardAndRate.length == 0) {
//       const { error, arrAwardInt, rate, totalPay, listAward, arrAwardStr } =
//         this.genRandomArrAwardInt(
//           createRequestDto,
//           lotteryInfo,
//           matricGiai,
//           false
//         );
//       return {
//         arrAwardInt,
//         totalPay,
//         arrAwardStr,
//       };
//     }

//     awardAndRate = awardAndRate.sort((a, b) => a.rate - b.rate);
//     return {
//       arrAwardInt: awardAndRate[0].arrAwardInt,
//       totalPay: awardAndRate[0].totalPay,
//       arrAwardStr: awardAndRate[0].arrAwardStr,
//     };
//   }

//   initMatricGiai(lotteryInfo: LotteryInfo) {
//     const arrAward: number[] = [];
//     for (let i = 0; i < 18; i++) {
//       arrAward.push(-1);
//     }
//     const matricGiai: MatricGiai = {
//       arrGiai0: new Array(),
//       arrGiai8: new Array(),
//       arrGiaiLo: new Array(),
//       whiteListLo: new Array(),
//       whiteListGia0: new Array(),
//       whiteListGia8: new Array(),
//       arrAwardInt: arrAward,
//     };

//     lotteryInfo.mapMatricInt.forEach((value, key) => {
//       if (value.giai0Pay > 0) {
//         matricGiai.arrGiai0.push({ value: key, amount: value.giai0Pay });
//       } else {
//         matricGiai.whiteListGia0.push(key);
//       }

//       if (value.giai8Pay > 0) {
//         matricGiai.arrGiai8.push({ value: key, amount: value.giai8Pay });
//       } else {
//         matricGiai.whiteListGia8.push(key);
//       }

//       if (value.giaiLoPay > 0) {
//         matricGiai.arrGiaiLo.push({ value: key, amount: value.giaiLoPay });
//       } else {
//         matricGiai.whiteListLo.push(key);
//       }
//     });

//     if (matricGiai.arrGiai0.length > 0) {
//       for (var i = 0; i < matricGiai.arrGiai0.length; i++) {
//         if (matricGiai.arrGiai0[i].amount > lotteryInfo.rootTotalRevenue) {
//           matricGiai.arrGiai0.splice(i, 1);
//           i--;
//         }
//       }
//     }

//     if (matricGiai.arrGiai8.length > 0) {
//       for (var i = 0; i < matricGiai.arrGiai8.length; i++) {
//         if (matricGiai.arrGiai8[i].amount > lotteryInfo.rootTotalRevenue) {
//           matricGiai.arrGiai8.splice(i, 1);
//           i--;
//         }
//       }
//     }

//     if (matricGiai.arrGiaiLo.length > 0) {
//       for (var i = 0; i < matricGiai.arrGiaiLo.length; i++) {
//         if (matricGiai.arrGiaiLo[i].amount > lotteryInfo.rootTotalRevenue) {
//           matricGiai.arrGiaiLo.splice(i, 1);
//           i--;
//         }
//       }
//     }

//     if (matricGiai.arrGiai0.length > 0) {
//       matricGiai.arrGiai0 = matricGiai.arrGiai0.sort(
//         (a, b) => a.amount - b.amount
//       );
//     }
//     if (matricGiai.arrGiai8.length > 0) {
//       matricGiai.arrGiai8 = matricGiai.arrGiai8.sort(
//         (a, b) => a.amount - b.amount
//       );
//     }
//     if (matricGiai.arrGiaiLo.length > 0) {
//       matricGiai.arrGiaiLo = matricGiai.arrGiaiLo.sort(
//         (a, b) => a.amount - b.amount
//       );
//     }

//     return matricGiai;
//   }

//   genRandomArrAwardInt(
//     createRequestDto: LotteryRequestDetailDto,
//     lotteryInfo: LotteryInfo,
//     matricGiai: MatricGiai,
//     isRandom: boolean,
//   ) {
//     // for (let i = 0; i < arrAward.length; i++) {
//     //   if (i == 0) {
//     //     arrAwardStr.push(this.initRandomStr(100000, 1000000, arrAward[i]));
//     //   } else if (i <= 2) {
//     //     arrAwardStr.push(this.initRandomStr(10000, 100000, arrAward[i]));
//     //   } else if (i <= 11) {
//     //     arrAwardStr.push(this.initRandomStr(10000, 100000, arrAward[i]));
//     //   } else if (i <= 15) {
//     //     arrAwardStr.push(this.initRandomStr(1000, 10000, arrAward[i]));
//     //   } else if (i <= 16) {
//     //     arrAwardStr.push(this.initRandomStr(100, 1000, arrAward[i]));
//     //   } else if (i == 17) {
//     //     arrAwardStr.push(this.initRandomStr(10, 100, arrAward[i]));
//     //   }
//     // }
//     // return arrAwardStr;
//     const arrAwardStr: string[] = []; // giải chính thức ra
//     for (let i = 0; i < 18; i++) {
//       arrAwardStr.push('');
//     }
//     let totalPayment = 0;
//     const mapAwardPrinft = new Map<number, any>();

//     const matricGiaiNew: MatricGiai = { ...matricGiai };

//     // 0
//     const award0Dto = this.initAwardGiai0(
//       matricGiaiNew,
//       lotteryInfo,
//       mapAwardPrinft,
//       isRandom,
//       totalPayment,
//       createRequestDto
//     );
//     totalPayment = totalPayment + award0Dto.paymentSub;
//     arrAwardStr[0] = award0Dto.awardStr;

//     // 17
//     const award8Dto = this.randomGiai8(
//       matricGiaiNew,
//       lotteryInfo,
//       mapAwardPrinft,
//       isRandom,
//       totalPayment,
//       createRequestDto
//     );
//     totalPayment = totalPayment + award8Dto.paymentSub;
//     arrAwardStr[17] = award8Dto.awardStr;

//     const paymentGiai1to7 = this.initGiai1To7(matricGiaiNew,
//       lotteryInfo,
//       mapAwardPrinft,
//       arrAwardStr,
//       isRandom,
//       totalPayment,
//       createRequestDto
//     );
//     totalPayment = totalPayment + paymentGiai1to7;
//     return {
//       error: false,
//       arrAwardInt: matricGiaiNew.arrAwardInt,
//       rate: 1 - (totalPayment * 1.0) / (1.0 * lotteryInfo.rootTotalRevenue),
//       totalPay: totalPayment,
//       listAward: mapAwardPrinft,
//       arrAwardStr: arrAwardStr,
//     };
//   }

//   initGiai1To7(matricGiaiNew: MatricGiai,
//     lotteryInfo: LotteryInfo,
//     mapAwardPrinft: Map<number, any>,
//     arrAwardStr: string[],
//     isRandom: boolean,
//     totalPay: number,
//     createRequestDto: LotteryRequestDetailDto,
//   ): number {
//     // remove giai 0 va 8
//     for (let i = 0; i < matricGiaiNew.arrGiaiLo.length; i++) {
//       if (matricGiaiNew.arrGiaiLo[i].value == matricGiaiNew.arrAwardInt[17]) {
//         matricGiaiNew.arrGiaiLo.slice(i, 1);
//       } else if (
//         matricGiaiNew.arrGiaiLo[i].value == matricGiaiNew.arrAwardInt[0]
//       ) {
//         matricGiaiNew.arrGiaiLo.slice(i, 1);
//       }
//     }

//     // TODO xem lai cach tinh 3 va 4
//     let paymentGiai1to7 = 0;


//     if (
//       matricGiaiNew.arrGiaiLo.length == 0 ||
//       matricGiaiNew.whiteListLo.length == lotteryInfo.maxlength2so
//     ) {
//       for (let i = 1; i < 17; i++) {
//         const index = this.genRandom(0, matricGiaiNew.whiteListLo.length - 1);
//         matricGiaiNew.arrAwardInt[i] = matricGiaiNew.whiteListLo[index];
//         paymentGiai1to7 = paymentGiai1to7 + 0 + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
//       }
//     } else {
//       for (let i = 1; i < 17; i++) {
//         const index = this.genRandom(0, matricGiaiNew.arrGiaiLo.length - 1);
//         if (
//           index < matricGiaiNew.arrGiaiLo.length - 1 &&
//           isRandom &&
//           totalPay + paymentGiai1to7 + matricGiaiNew.arrGiaiLo[index].amount <
//           lotteryInfo.minWinNhaCai
//         ) {
//           matricGiaiNew.arrAwardInt[i] = matricGiaiNew.arrGiaiLo[index].value;
//           // totalPay = totalPay + matricGiaiNew.arrGiaiLo[index].amount;
//           paymentGiai1to7 = paymentGiai1to7 + matricGiaiNew.arrGiaiLo[index].amount + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
//           this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiaiLo[index]);

//           if (matricGiaiNew.arrGiaiLo.length > 1) {
//             matricGiaiNew.arrGiaiLo.splice(index, 1);
//           } else {
//             matricGiaiNew.arrGiaiLo = [];
//           }
//         } else {
//           if (
//             (matricGiaiNew.arrGiaiLo.length > 0 &&
//               totalPay + paymentGiai1to7 + matricGiaiNew.arrGiaiLo[0].amount <
//               lotteryInfo.minWinNhaCai) ||
//             matricGiaiNew.whiteListGia8.length == 0
//           ) {
//             matricGiaiNew.arrAwardInt[i] = matricGiaiNew.arrGiaiLo[0].value;
//             // totalPay = totalPay + matricGiaiNew.arrGiaiLo[0].amount;
//             paymentGiai1to7 = paymentGiai1to7 + matricGiaiNew.arrGiaiLo[0].amount + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
//             this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiaiLo[0]);
//             if (matricGiaiNew.arrGiaiLo.length > 1) {
//               matricGiaiNew.arrGiaiLo.splice(0, 1);
//             } else {
//               matricGiaiNew.arrGiaiLo = [];
//             }
//           } else {
//             const index = this.genRandom(
//               0,
//               matricGiaiNew.whiteListLo.length - 1
//             );
//             matricGiaiNew.arrAwardInt[i] = matricGiaiNew.whiteListLo[index];
//             paymentGiai1to7 = paymentGiai1to7 + this.getPayment3And4SoAwardStr(i, matricGiaiNew.arrAwardInt[i], arrAwardStr, createRequestDto);
//           }
//         }
//       }
//     }

//     return paymentGiai1to7;
//   }

//   getPayment3And4SoAwardStr(
//     index: number,
//     awardInt: number,
//     arrAwardStr: string[],
//     createRequestDto: LotteryRequestDetailDto,
//   ) {
//     if (index <= 11) {
//       const prefix3So = this.genRandom(0, 999);
//       const award5So = this.getStrLength3(prefix3So) + this.getStrLength2(awardInt);
//       const subAwardDto = this.processGetPayment3And4So(createRequestDto, awardInt, award5So);
//       arrAwardStr[index] = subAwardDto.awardStr;
//       return subAwardDto.paymentSub;
//     }
//     if (index <= 15) {
//       const prefix3So = this.genRandom(0, 99);
//       const award4So = this.getStrLength2(prefix3So) + this.getStrLength2(awardInt);
//       const subAwardDto = this.processGetPayment3And4So(createRequestDto, awardInt, award4So);
//       arrAwardStr[index] = subAwardDto.awardStr;
//       return subAwardDto.paymentSub;
//     }
//     if (index <= 16) {
//       const prefix3So = this.genRandom(0, 9);
//       const award3So = `${prefix3So}` + this.getStrLength2(awardInt);
//       const subAwardDto = this.processGetPayment3So(createRequestDto, awardInt, award3So);
//       arrAwardStr[index] = subAwardDto.awardStr;
//       return subAwardDto.paymentSub;
//     }
//     return 0;
//   }

//   processGetPayment3And4So(
//     createRequestDto: LotteryRequestDetailDto,
//     awardInt: number,
//     subAwardStr: string,
//   ) {
//     const arrSubAwardRandom: SubAwardDto[] = [];
//     for (let i = 0; i < this.loopPrefix; i++) {

//       const payLo3So = this.getPayment3o(subAwardStr, createRequestDto?.baoLo?.lo3So);
//       const payLo4So = this.getPayment4o(subAwardStr, createRequestDto?.baoLo?.lo4So);
//       // TODO de 3 so, 4 so
//       const totaPayment3so4So = payLo3So + payLo4So;
//       if (payLo3So + payLo4So == 0) {
//         const subAward: SubAwardDto = {
//           awardInt: awardInt,
//           awardStr: subAwardStr,
//           isInclude3And4: false,
//           paymentSub: totaPayment3so4So
//         }
//         return subAward;

//       }
//       arrSubAwardRandom.push({ awardInt: awardInt, awardStr: subAwardStr, isInclude3And4: true, paymentSub: totaPayment3so4So });
//     }

//     const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
//     return arrSortAward[0];
//   }

//   processGetPayment3So(
//     createRequestDto: LotteryRequestDetailDto,
//     awardInt: number,
//     subAwardStr: string,
//   ) {
//     const arrSubAwardRandom: SubAwardDto[] = [];
//     for (let i = 0; i < this.loopPrefix; i++) {
//       const payLo3So = this.getPayment3o(subAwardStr, createRequestDto?.baoLo?.lo3So);
//       const totaPayment3so4So = payLo3So;
//       if (payLo3So == 0) {
//         const subAward: SubAwardDto = {
//           awardInt: awardInt,
//           awardStr: subAwardStr,
//           isInclude3And4: false,
//           paymentSub: totaPayment3so4So
//         }
//         return subAward;

//       }
//       arrSubAwardRandom.push({ awardInt: awardInt, awardStr: subAwardStr, isInclude3And4: true, paymentSub: totaPayment3so4So });
//     }

//     const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
//     return arrSortAward[0];
//   }

//   initAwardGiai0(
//     matricGiaiNew: MatricGiai,
//     lotteryInfo: LotteryInfo,
//     mapAwardPrinft: Map<number, any>,
//     isRandom: boolean,
//     totalPay: number,
//     createRequestDto: LotteryRequestDetailDto,
//   ) {

//     const arrSubAwardRandom: SubAwardDto[] = [];

//     for (let i = 0; i < this.loop3And4Length; i++) {
//       const subAwardRandom = this.randomGiai0(matricGiaiNew,
//         lotteryInfo,
//         mapAwardPrinft,
//         isRandom,
//         totalPay,
//         createRequestDto
//       );

//       if (subAwardRandom.isInclude3And4 == false) {
//         matricGiaiNew.arrAwardInt[17] = subAwardRandom.awardInt;
//         return subAwardRandom;
//       }
//       arrSubAwardRandom.push(subAwardRandom);

//     }

//     const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
//     matricGiaiNew.arrAwardInt[17] = arrSortAward[0].awardInt;
//     return arrSortAward[0];
//   }

//   randomGiai0(matricGiaiNew: MatricGiai,
//     lotteryInfo: LotteryInfo,
//     mapAwardPrinft: Map<number, any>,
//     isRandom: boolean,
//     totalPay: number,
//     createRequestDto: LotteryRequestDetailDto,
//   ) {
//     let awardInt = null;
//     let pay2So = 0;

//     if (matricGiaiNew.arrGiai0.length == 0) {
//       const index = this.genRandom(0, matricGiaiNew.whiteListGia0.length - 1);
//       // matricGiaiNew.arrAward[0] = matricGiaiNew.whiteListGia0[index];
//       awardInt = matricGiaiNew.whiteListGia0[index];
//     } else {
//       const index = this.genRandom(0, matricGiaiNew.arrGiai0.length - 1);
//       if (
//         index < matricGiaiNew.arrGiai0.length - 1 &&
//         isRandom &&
//         totalPay + matricGiaiNew.arrGiai0[index].amount <
//         +lotteryInfo.minWinNhaCai &&
//         +matricGiaiNew.arrGiai0[0].amount <
//         lotteryInfo.rootTotalRevenue * lotteryInfo.rateDeWin
//       ) {
//         awardInt = matricGiaiNew.arrGiai0[index].value;
//         pay2So = matricGiaiNew.arrGiai0[index].amount;
//         // matricGiaiNew.arrAward[0] = matricGiaiNew.arrGiai0[index].value;
//         // totalPay = totalPay + matricGiaiNew.arrGiai0[index].amount;
//         this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai0[index]);
//       } else {
//         if (
//           matricGiaiNew.arrGiai0.length == lotteryInfo.maxlength2so ||
//           (matricGiaiNew.arrGiai0[0].amount + totalPay <
//             +lotteryInfo.minWinNhaCai &&
//             +matricGiaiNew.arrGiai0[0].amount <
//             lotteryInfo.rootTotalRevenue * lotteryInfo.rateDeWin) ||
//           matricGiaiNew.whiteListGia0.length == 0
//         ) {
//           awardInt = matricGiaiNew.arrGiai0[0].value;
//           pay2So = matricGiaiNew.arrGiai0[0].amount;
//           // matricGiaiNew.arrAward[0] = matricGiaiNew.arrGiai0[0].value;
//           // totalPay = totalPay + matricGiaiNew.arrGiai0[0].amount;
//           this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai0[0]);
//         } else {
//           const index = this.genRandom(
//             0,
//             matricGiaiNew.whiteListGia0.length - 1
//           );
//           awardInt = matricGiaiNew.whiteListGia0[index];
//         }
//       }
//     }

//     // check 3 va 4 so
//     const arrSubAwardRandom: SubAwardDto[] = [];
//     for (let i = 0; i < this.loopPrefix; i++) {
//       const prefix4So = this.genRandom(0, 9999);
//       const award6So = this.getStrLength4(prefix4So) + this.getStrLength2(awardInt);

//       const payLo3So = this.getPayment3o(award6So, createRequestDto?.baoLo?.lo3So);
//       const payLo4So = this.getPayment4o(award6So, createRequestDto?.baoLo?.lo4So);
//       // TODO de 3 so, 4 so
//       const totaPayment3so4So = payLo3So + payLo4So + pay2So;
//       if (payLo3So + payLo4So == 0) {
//         const subAward: SubAwardDto = {
//           awardInt: awardInt,
//           awardStr: award6So,
//           isInclude3And4: false,
//           paymentSub: totaPayment3so4So
//         }
//         return subAward;

//       }
//       arrSubAwardRandom.push({ awardInt: awardInt, awardStr: award6So, isInclude3And4: true, paymentSub: totaPayment3so4So });
//     }

//     const arrSortAward = arrSubAwardRandom.sort((a, b) => a.paymentSub - b.paymentSub);
//     return arrSortAward[0];
//   }

//   randomGiai8(matricGiaiNew: MatricGiai,
//     lotteryInfo: LotteryInfo,
//     mapAwardPrinft: Map<number, any>,
//     isRandom: boolean,
//     totalPay: number,
//     createRequestDto: LotteryRequestDetailDto,
//   ) {
//     let awardInt = null;
//     let pay2So = 0;

//     if (
//       matricGiaiNew.arrGiai8.length == 0 ||
//       matricGiaiNew.whiteListGia8.length === lotteryInfo.maxlength2so
//     ) {
//       const index = this.genRandom(0, matricGiaiNew.whiteListGia8.length - 1);
//       awardInt = matricGiaiNew.whiteListGia8[index];
//     } else {
//       const index = this.genRandom(0, matricGiaiNew.arrGiai8.length - 1);

//       if (
//         index < matricGiaiNew.arrGiai8.length - 1 &&
//         isRandom &&
//         totalPay + matricGiaiNew.arrGiai8[index].amount <
//         lotteryInfo.minWinNhaCai
//       ) {
//         awardInt = matricGiaiNew.arrGiai8[index].value;
//         pay2So = matricGiaiNew.arrGiai8[index].amount;
//         this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai8[index]);
//       } else {
//         if (
//           matricGiaiNew.arrGiai8.length == lotteryInfo.maxlength2so ||
//           (matricGiaiNew.arrGiai8[0].amount + totalPay <
//             lotteryInfo.minWinNhaCai &&
//             +matricGiaiNew.arrGiai8[0].amount <
//             lotteryInfo.rootTotalRevenue * lotteryInfo.rateDeWin) ||
//           matricGiaiNew.whiteListGia8.length == 0
//         ) {
//           awardInt = matricGiaiNew.arrGiai8[0].value;
//           pay2So = matricGiaiNew.arrGiai8[0].amount;
//           this.pushMapAward(mapAwardPrinft, matricGiaiNew.arrGiai8[0]);
//         } else {
//           const index = this.genRandom(
//             0,
//             matricGiaiNew.whiteListGia8.length - 1
//           );
//           awardInt = matricGiaiNew.whiteListGia8[index];
//         }
//       }
//     }
//     matricGiaiNew.arrAwardInt[17] = awardInt;
//     const subAward: SubAwardDto = {
//       awardInt: awardInt,
//       awardStr: this.getStrLength2(awardInt),
//       isInclude3And4: false,
//       paymentSub: pay2So
//     }
//     return subAward;
//   }


//   getPayment3o(award4So: string, lo3So: ValueDto[]) {
//     if (!lo3So || lo3So.length === 0) return 0;
//     let payment = 0;
//     for (const element of lo3So) {
//       if (element.value && award4So.toString().endsWith(this.getStrLength3(element.value))) {
//         payment = payment + (+element.amount * +RateCaculation.Lo_3_So);
//       }
//     }

//     return payment;
//   }


//   getPayment4o(award4So: string, arrValueDto: ValueDto[]) {
//     if (!arrValueDto || arrValueDto.length === 0) return 0;
//     let payment = 0;
//     for (const element of arrValueDto) {
//       if (element.value && award4So.toString().endsWith(this.getStrLength4(element.value))) {
//         payment = payment + (+element.amount * +RateCaculation.Lo_4_So);
//       }
//     }

//     return payment;
//   }


//   getStrLength2(value: number) {
//     if (!value || value < 0) return `${this.genRandom(10, 99)}`;
//     if (value < 10) return `0${value}`;
//     if (value < 100) return `${value}`;
//     return value.toString().slice(0, 2);
//   }

//   getStrLength3(value: number) {
//     if (!value || value < 100) return `0${this.getStrLength2(value)}`;
//     if (value < 1000) return `${value}`;
//     return value.toString().slice(0, 3);
//   }

//   getStrLength4(value: number) {
//     if (!value || value < 1000) return `0${this.getStrLength3(value)}`;
//     if (value < 10000) return `${value}`;
//     return value.toString().slice(0, 4);
//   }

//   endsWithElement(arr: Array<number>, number: number) {
//     for (const element of arr) {
//       if (number.toString().endsWith(element.toString())) {
//         return true;
//       }
//     }
//     return false;
//   }

//   pushMapAward(mapAward: Map<number, any>, baseGiaiDto: BaseGiaiDto) {
//     const data = mapAward.get(baseGiaiDto.value);
//     if (data) {
//       data.amount = +data.amount + baseGiaiDto.amount;
//       mapAward.set(baseGiaiDto.value, data);
//     } else {
//       mapAward.set(baseGiaiDto.value, {
//         value: baseGiaiDto.value,
//         amount: baseGiaiDto.amount,
//       });
//     }
//   }

//   getTotalRevenue(
//     createRequestDto: LotteryRequestDetailDto,
//     lotteryInfo: LotteryInfo
//   ) {
//     let mapMatricInt = new Map<number, MatricInt>();
//     for (let i = 0; i < 10000; i++) {
//       if (i < 100) {
//         let matricInt: MatricInt = {
//           value: i,
//           giai8Pay: 0,
//           giai0Pay: 0,
//           giaiLoPay: 0,
//           giai0Revenue: 0,
//           giai8Revenue: 0,
//           giaiLoRevenue: 0,
//         };
//         mapMatricInt.set(i, matricInt);
//       }
//     }

//     lotteryInfo.mapMatricInt = mapMatricInt;
//     let totalRevenue = 0;

//     if (createRequestDto.danhDe) {
//       if (createRequestDto.danhDe.deDacBiet?.length > 0) {
//         for (const valueDto of createRequestDto.danhDe.deDacBiet) {
//           let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
//           valueMap.giai0Pay += valueDto.amount * +RateCaculation.De_Dac_Biet;
//           valueMap.giai0Revenue += valueDto.amount;

//           totalRevenue += valueDto.amount;
//           lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
//         }
//       }

//       if (createRequestDto.danhDe.deDau?.length > 0) {
//         for (const valueDto of createRequestDto.danhDe.deDau) {
//           let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
//           valueMap.giai8Pay += valueDto.amount * +RateCaculation.De_Dau;
//           valueMap.giai8Revenue += valueDto.amount;

//           totalRevenue += valueDto.amount;
//           lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
//         }
//       }

//       if (createRequestDto.danhDe.deDauDuoi?.length > 0) {
//         for (const valueDto of createRequestDto.danhDe.deDauDuoi) {
//           let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
//           valueMap.giai0Pay += valueDto.amount * +RateCaculation.De_Dau_Duoi;
//           valueMap.giai8Pay += valueDto.amount * +RateCaculation.De_Dau_Duoi;

//           valueMap.giai0Revenue += valueDto.amount;
//           valueMap.giai8Revenue += valueDto.amount;

//           totalRevenue += valueDto.amount;
//           lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
//         }
//       }
//     }

//     if (createRequestDto.baoLo) {
//       if (createRequestDto.baoLo?.lo2So?.length > 0) {
//         for (const valueDto of createRequestDto.baoLo.lo2So) {
//           let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
//           valueMap.giaiLoPay += valueDto.amount * +RateCaculation.Lo_2_So;
//           valueMap.giaiLoRevenue += valueDto.amount;

//           valueMap.giai0Pay += valueDto.amount * +RateCaculation.Lo_2_So;
//           valueMap.giai0Revenue += valueDto.amount;

//           valueMap.giai8Pay += valueDto.amount * +RateCaculation.Lo_2_So;
//           valueMap.giai8Revenue += valueDto.amount;

//           totalRevenue += valueDto.amount;
//           lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
//         }
//       }

//       if (createRequestDto.baoLo?.lo2So1k?.length > 0) {
//         for (const valueDto of createRequestDto.baoLo.lo2So1k) {
//           let valueMap = lotteryInfo.mapMatricInt.get(valueDto.value);
//           valueMap.giaiLoPay += valueDto.amount * +RateCaculation.Lo_2_So_1k;
//           valueMap.giaiLoRevenue += valueDto.amount;

//           valueMap.giai0Pay += valueDto.amount * +RateCaculation.Lo_2_So_1k;
//           valueMap.giai0Revenue += valueDto.amount;

//           valueMap.giai8Pay += valueDto.amount * +RateCaculation.Lo_2_So_1k;
//           valueMap.giai8Revenue += valueDto.amount;
//           totalRevenue += valueDto.amount;
//           lotteryInfo.mapMatricInt.set(valueDto.value, valueMap);
//         }
//       }

//       if (createRequestDto.baoLo?.lo3So?.length > 0) {
//         for (const valueDto of createRequestDto.baoLo.lo3So) {
//           totalRevenue += valueDto.amount;
//         }
//       }

//       if (createRequestDto.baoLo?.lo4So?.length > 0) {
//         for (const valueDto of createRequestDto.baoLo.lo4So) {
//           totalRevenue += valueDto.amount;
//         }
//       }
//     }


//     return totalRevenue;
//   }

//   getDetail1to8(arrAwardStr: string[]) {
//     const arr = [];
//     for (let i = 0; i < 9; i++) {
//       arr.push("");
//     }
//     arr[0] = arrAwardStr[0];
//     arr[1] = arrAwardStr[1];
//     arr[2] = arrAwardStr[2];
//     arr[3] = arrAwardStr[3] + "," + arrAwardStr[4];
//     arr[4] =
//       arrAwardStr[5] +
//       "," +
//       arrAwardStr[6] +
//       "," +
//       arrAwardStr[7] +
//       "," +
//       arrAwardStr[8] +
//       "," +
//       arrAwardStr[9] +
//       "," +
//       arrAwardStr[10] +
//       "," +
//       arrAwardStr[11];
//     arr[5] = arrAwardStr[12];
//     arr[6] = arrAwardStr[13] + "," + arrAwardStr[14] + "," + arrAwardStr[15];
//     arr[7] = arrAwardStr[16];
//     arr[8] = arrAwardStr[17];
//     return arr;
//   }

//   initArrAwardStr(arrAward: number[]) {
//     const arrAwardStr = [];
//     for (let i = 0; i < arrAward.length; i++) {
//       if (i == 0) {
//         arrAwardStr.push(this.initRandomStr(100000, 1000000, arrAward[i]));
//       } else if (i <= 2) {
//         arrAwardStr.push(this.initRandomStr(10000, 100000, arrAward[i]));
//       } else if (i <= 11) {
//         arrAwardStr.push(this.initRandomStr(10000, 100000, arrAward[i]));
//       } else if (i <= 15) {
//         arrAwardStr.push(this.initRandomStr(1000, 10000, arrAward[i]));
//       } else if (i <= 16) {
//         arrAwardStr.push(this.initRandomStr(100, 1000, arrAward[i]));
//       } else if (i == 17) {
//         arrAwardStr.push(this.initRandomStr(10, 100, arrAward[i]));
//       }
//     }
//     return arrAwardStr;
//   }

//   initRandomStr(min: number, max: number, endValue: number) {
//     const randomValue = this.genRandom(min, max - 1);
//     let valueStr = randomValue + "";
//     let endStr = endValue + "";
//     if (endValue < 10) endStr = "0" + endValue;
//     if (randomValue > 100) {
//       const random0 = this.genRandom(0, 15);
//       if (random0 <= 1) {
//         return "0" + valueStr.slice(1, valueStr.length - 2) + "" + endStr;
//       }
//     }
//     return valueStr.slice(0, valueStr.length - 2) + "" + endStr;
//   }

//   initValue(length: number, endValue: number) {
//     const randomLeng = this.genRandom(
//       Math.pow(10, length),
//       Math.pow(10, length + 1) - 1
//     );
//     let valueStr = randomLeng + "";
//     return valueStr.slice(0, valueStr.length - 2) + "" + endValue;
//   }

//   genRandom(min: number, max: number): number {
//     const randomDecimal = Math.random();
//     const randomNumber = Math.floor(randomDecimal * (max - min + 1)) + min;
//     return randomNumber;
//   }

//   getGiai0(matricGiai: MatriGiaiDto, fullInfoAward: FullInfoAward) {
//     const valueAmountList: BaseGiaiDto[] = [];

//     if (matricGiai.giai0.size > 0) {
//       matricGiai.giai0.forEach((value, key) => {
//         // Perform operations on each value
//         valueAmountList.push({ value: key, amount: +value });
//       });
//     }

//     if (matricGiai.lo2So.size > 0) {
//       matricGiai.lo2So.forEach((value, key) => {
//         // Perform operations on each value
//         for (const baseGiai of valueAmountList) {
//           if (baseGiai.value == key) {
//             baseGiai.amount = +value;
//             break;
//           }
//         }
//       });
//     }
//   }

//   /**
//    *
//    * @param arrValueDto
//    * @param rate
//    * @param calculators
//    * @param type
//    * @returns
//    */

//   getSumRevenue(
//     arrValueDto: ValueDto[],
//     rate: number,
//     giai: Map<number, number>,
//     type: string
//   ) {
//     let sum = 0;

//     for (let i = 0; i < arrValueDto.length; i++) {
//       const payWin = +arrValueDto[i].amount;
//       sum += payWin;
//       const valuueGiai = +giai.get(arrValueDto[i].value);
//       if (valuueGiai) {
//         giai.set(
//           arrValueDto[i].value,
//           valuueGiai + +arrValueDto[i].amount * rate
//         );
//       }
//     }
//     return sum;
//   }

//   getSumRevenueDeDauDuoi(
//     arrValueDto: ValueDto[],
//     rate: number,
//     giai0: Map<number, number>,
//     giai8: Map<number, number>,
//     type: string
//   ) {
//     let sum = 0;

//     for (let i = 0; i < arrValueDto.length; i++) {
//       const payWin = +arrValueDto[i].amount;
//       sum += payWin;
//       const valuueGiai0 = +giai0.get(arrValueDto[i].value);
//       if (valuueGiai0) {
//         giai0.set(
//           arrValueDto[i].value,
//           valuueGiai0 + +arrValueDto[i].amount * rate
//         );
//       }

//       const valuueGiai = +giai8.get(arrValueDto[i].value);
//       if (valuueGiai) {
//         giai8.set(
//           arrValueDto[i].value,
//           valuueGiai + +arrValueDto[i].amount * rate
//         );
//       }
//     }
//     return sum;
//   }

//   async update(
//     id: number,
//     updateLotteryRequestDto: UpdateLotteryRequestDto
//   ): Promise<any> {
//     try {
//       // let foundLotteryRequest = await this.lotteryRequestRepository.findOneBy({
//       //   id,
//       // });
//       // if (!foundLotteryRequest) {
//       //   return new ErrorResponse(
//       //     STATUSCODE.COMMON_NOT_FOUND,
//       //     `LotteryRequest with id: ${id} not found!`,
//       //     ERROR.NOT_FOUND
//       //   );
//       // }
//       // foundLotteryRequest = {
//       //   ...foundLotteryRequest,
//       //   ...updateLotteryRequestDto,
//       //   updatedAt: new Date(),
//       // };
//       // await this.lotteryRequestRepository.save(foundLotteryRequest);
//       // return new SuccessResponse(
//       //   STATUSCODE.COMMON_UPDATE_SUCCESS,
//       //   foundLotteryRequest,
//       //   MESSAGE.UPDATE_SUCCESS
//       // );
//     } catch (error) {
//       this.logger.debug(
//         `${LotteryRequestService.name} is Logging error: ${JSON.stringify(
//           error
//         )}`
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
//       const foundLotteryRequest = await this.lotteryRequestRepository.findOneBy(
//         {
//           id,
//         }
//       );

//       if (!foundLotteryRequest) {
//         return new ErrorResponse(
//           STATUSCODE.COMMON_NOT_FOUND,
//           `LotteryRequest with id: ${id} not found!`,
//           ERROR.NOT_FOUND
//         );
//       }
//       await this.lotteryRequestRepository.delete(id);

//       return new SuccessResponse(
//         STATUSCODE.COMMON_DELETE_SUCCESS,
//         `LotteryRequest has deleted id: ${id} success!`,
//         MESSAGE.DELETE_SUCCESS
//       );
//     } catch (error) {
//       this.logger.debug(
//         `${LotteryRequestService.name} is Logging error: ${JSON.stringify(
//           error
//         )}`
//       );
//       return new ErrorResponse(
//         STATUSCODE.COMMON_FAILED,
//         error,
//         ERROR.DELETE_FAILED
//       );
//     }
//   }
// }