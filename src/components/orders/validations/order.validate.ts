import { HttpException, HttpStatus } from "@nestjs/common";
import { OrderHelper } from "src/common/helper";
import { BaCangType, BaoLoType, BonCangType, DanhDeType, DauDuoiType, LoTruocType, LoXienType, TroChoiThuViType } from "src/system/enums/lotteries";
import { ERROR } from '../../../system/constants/messageError';
import { MAX_ORDERS_LO2SO, MAX_ORDERS_LO3SO, MAX_ORDERS_LO4SO, MAX_ORDERS_DAU_DUOI, MAX_ORDERS_LOXIEN } from "src/system/constants";

export class OrderValidate {
    static validateOrders(orders: any, ordersBefore: Array<any>, turnIndex: string) {
        let tempOrders = JSON.parse(JSON.stringify(orders));

        if (ordersBefore && ordersBefore.length > 0) {
            for (const ord of ordersBefore) {
                tempOrders.push({
                    betType: ord.betType,
                    childBetType: ord.childBetType,
                    detail: ord.detail,
                    multiple: ord.multiple,
                    type: `${ord.type}${ord.seconds}s`,
                    turnIndex: ord.turnIndex,
                });
            }
        }

        let numbersLo2So: any = [];
        let numbersLo2So1k: any = [];
        let numbersLo3So: any = [];
        let numbersLo4So: any = [];
        let numbersDeDau: any = [];
        let numbersDeDacBiet: any = [];
        let numbersDauDuoi: any = [];
        let numbersBaCangDau: any = [];
        let numbersBaCangDacBiet: any = [];
        let numbersBaCangDauDuoi: any = [];
        let numbersBonCangDacBiet: any = [];
        let numbersDau: any = [];
        let numbersDuoi: any = [];
        let numbersTruotXien4: any = [];
        let numbersTruotXien8: any = [];
        let numbersTruotXien10: any = [];
        let numbersXien2: any = [];
        let numbersXien3: any = [];
        let numbersXien4: any = [];
        let orderDetailLo2SoGiaiDacBiet = '';

        for (const order of tempOrders) {
            if (order.turnIndex && order.turnIndex !== turnIndex) continue;

            // 2 so
            switch (order.childBetType) {
                case BaoLoType.Lo2So:
                    numbersLo2So = [...new Set([...numbersLo2So, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case BaoLoType.Lo2So1k:
                    numbersLo2So1k = [...new Set([...numbersLo2So1k, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case DanhDeType.DeDau:
                    numbersDeDau = [...new Set([...numbersDeDau, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case DanhDeType.DeDacBiet:
                    numbersDeDacBiet = [...new Set([...numbersDeDacBiet, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case DanhDeType.DeDauDuoi:
                    numbersDauDuoi = [...new Set([...numbersDauDuoi, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;
            }
            if (
                numbersLo2So.length > MAX_ORDERS_LO2SO ||
                numbersLo2So1k.length > MAX_ORDERS_LO2SO ||
                numbersDeDau.length > MAX_ORDERS_LO2SO ||
                numbersDeDacBiet.length > MAX_ORDERS_LO2SO ||
                numbersDauDuoi.length > MAX_ORDERS_LO2SO
            ) {
                throw new HttpException(
                    {
                        message: ERROR.MESSAGE_LO_2_S0_INVALID,
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // 3 so
            switch (order.childBetType) {
                case BaoLoType.Lo3So:
                    numbersLo3So = [...new Set([...numbersLo3So, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case BaCangType.BaCangDau:
                    numbersBaCangDau = [...new Set([...numbersBaCangDau, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case BaCangType.BaCangDacBiet:
                    numbersBaCangDacBiet = [...new Set([...numbersBaCangDacBiet, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case BaCangType.BaCangDauDuoi:
                    numbersBaCangDauDuoi = [...new Set([...numbersBaCangDauDuoi, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;
            }
            if (
                numbersLo3So.length > MAX_ORDERS_LO3SO ||
                numbersBaCangDau.length > MAX_ORDERS_LO3SO ||
                numbersBaCangDacBiet.length > MAX_ORDERS_LO3SO ||
                numbersBaCangDauDuoi.length > MAX_ORDERS_LO3SO
            ) {
                throw new HttpException(
                    {
                        message: ERROR.MESSAGE_LO_3_S0_INVALID,
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // 4 so
            switch (order.childBetType) {
                case BaoLoType.Lo4So:
                    numbersLo4So = [...new Set([...numbersLo4So, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case BonCangType.BonCangDacBiet:
                    numbersBonCangDacBiet = [...new Set([...numbersBonCangDacBiet, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;
            }
            if (
                numbersLo4So.length > MAX_ORDERS_LO4SO ||
                numbersBonCangDacBiet.length > MAX_ORDERS_LO4SO
            ) {
                throw new HttpException(
                    {
                        message: ERROR.MESSAGE_LO_4_S0_INVALID,
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // dau duoi
            switch (order.childBetType) {
                case DauDuoiType.Dau:
                    numbersDau = [...new Set([...numbersDau, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case DauDuoiType.Duoi:
                    numbersDuoi = [...new Set([...numbersDuoi, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;
            }
            if (
                numbersDau.length > MAX_ORDERS_DAU_DUOI ||
                numbersDuoi.length > MAX_ORDERS_DAU_DUOI
            ) {
                throw new HttpException(
                    {
                        message: ERROR.MESSAGE_DAU_CUOI_INVALID,
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // xien truot
            switch (order.childBetType) {
                case LoTruocType.TruotXien4:
                    numbersTruotXien4 = [...new Set([...numbersTruotXien4, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case LoTruocType.TruotXien8:
                    numbersTruotXien8 = [...new Set([...numbersTruotXien8, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case LoTruocType.TruotXien10:
                    numbersTruotXien10 = [...new Set([...numbersTruotXien10, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case LoXienType.Xien2:
                    numbersXien2 = [...new Set([...numbersXien2, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case LoXienType.Xien3:
                    numbersXien3 = [...new Set([...numbersXien3, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;

                case LoXienType.Xien4:
                    numbersXien4 = [...new Set([...numbersXien4, ...(OrderHelper.getNumbersOfOrder2Digit(order.detail))])];
                    break;
            }
            if (
                numbersTruotXien4.length > MAX_ORDERS_LOXIEN ||
                numbersTruotXien8.length > MAX_ORDERS_LOXIEN ||
                numbersTruotXien10.length > MAX_ORDERS_LOXIEN ||
                numbersXien2.length > MAX_ORDERS_LOXIEN ||
                numbersXien3.length > MAX_ORDERS_LOXIEN ||
                numbersXien4.length > MAX_ORDERS_LOXIEN
            ) {
                throw new HttpException(
                    {
                        message: ERROR.MESSAGE_LO_2_S0_INVALID,
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            // tro choi thu vi
            switch (order.childBetType) {
                case TroChoiThuViType.Lo2SoGiaiDacBiet:
                    if (orderDetailLo2SoGiaiDacBiet) {
                        orderDetailLo2SoGiaiDacBiet = orderDetailLo2SoGiaiDacBiet + ',' + order.detail;
                    } else {
                        orderDetailLo2SoGiaiDacBiet = order.detail;
                    }
                    const isValid = OrderHelper.isValid2SoDacBiet(orderDetailLo2SoGiaiDacBiet);
                    if (!isValid) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_TRO_CHOI_THU_VI_INVALID,
                            },
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    break;
            }

            // switch (order.childBetType) {
            //     case BaoLoType.Lo2So:
            //     case BaoLoType.Lo2So1k:
            //     case DanhDeType.DeDau:
            //     case DanhDeType.DeDacBiet:
            //     case DanhDeType.DeDauDuoi:
            //         const tempOrders2Digit = OrderHelper.getNumbersOfOrder2Digit(order.detail);
            //         numbers = [...new Set([...numbers, ...tempOrders2Digit])];
            //         if (numbers.length > MAX_ORDERS_LO2SO) {
            //             throw new HttpException(
            //                 {
            //                     message: ERROR.MESSAGE_LO_2_S0_INVALID,
            //                 },
            //                 HttpStatus.BAD_REQUEST,
            //             );
            //         }
            //         break;

            //     case BaoLoType.Lo3So:
            //     case BaCangType.BaCangDau:
            //     case BaCangType.BaCangDacBiet:
            //     case BaCangType.BaCangDauDuoi:
            //         const tempOrders3Digit = OrderHelper.getNumbersOfOrder3Digit(order.detail);
            //         numbers = [...new Set([...numbers, ...tempOrders3Digit])]
            //         if (numbers.length > MAX_ORDERS_LO3SO) {
            //             throw new HttpException(
            //                 {
            //                     message: ERROR.MESSAGE_LO_3_S0_INVALID,
            //                 },
            //                 HttpStatus.BAD_REQUEST,
            //             );
            //         }
            //         break;

            //     case BaoLoType.Lo4So:
            //     case BonCangType.BonCangDacBiet:
            //         const tempOrders4Digit = OrderHelper.getNumbersOfOrder4Digit(order.detail);
            //         numbers = [...new Set([...numbers, ...tempOrders4Digit])]
            //         if (numbers.length > MAX_ORDERS_LO4SO) {
            //             throw new HttpException(
            //                 {
            //                     message: ERROR.MESSAGE_LO_4_S0_INVALID,
            //                 },
            //                 HttpStatus.BAD_REQUEST,
            //             );
            //         }
            //         break;

            //     case DauDuoiType.Dau:
            //     case DauDuoiType.Duoi:
            //         const tempOrders2DigitDauDuoi = OrderHelper.getNumbersOfOrder2Digit(order.detail);
            //         numbers = [...new Set([...numbers, ...tempOrders2DigitDauDuoi])]
            //         if (numbers.length > MAX_ORDERS_DAU_DUOI) {
            //             throw new HttpException(
            //                 {
            //                     message: ERROR.MESSAGE_DAU_CUOI_INVALID,
            //                 },
            //                 HttpStatus.BAD_REQUEST,
            //             );
            //         }
            //         break;

            //     case LoTruocType.TruotXien4:
            //     case LoTruocType.TruotXien8:
            //     case LoTruocType.TruotXien10:
            //     case LoXienType.Xien2:
            //     case LoXienType.Xien3:
            //     case LoXienType.Xien4:
            //         const tempOrders = order.detail.split(',');
            //         numbers = [...new Set([...numbers, ...tempOrders])];
            //         if (numbers.length > MAX_ORDERS_LOXIEN) {
            //             throw new HttpException(
            //                 {
            //                     message: ERROR.MESSAGE_LO_2_S0_INVALID,
            //                 },
            //                 HttpStatus.BAD_REQUEST,
            //             );
            //         }
            //         break;

            //     case TroChoiThuViType.Lo2SoGiaiDacBiet:
            //         if (orderDetailLo2SoGiaiDacBiet) {
            //             orderDetailLo2SoGiaiDacBiet = orderDetailLo2SoGiaiDacBiet + ',' + order.detail;
            //         } else {
            //             orderDetailLo2SoGiaiDacBiet = order.detail;
            //         }
            //         const isValid = OrderHelper.isValid2SoDacBiet(orderDetailLo2SoGiaiDacBiet);
            //         if (!isValid) {
            //             throw new HttpException(
            //                 {
            //                     message: ERROR.MESSAGE_TRO_CHOI_THU_VI_INVALID,
            //                 },
            //                 HttpStatus.BAD_REQUEST,
            //             );
            //         }
            //         break;

            //     default:
            //         break;
            // }
        }
    }
}