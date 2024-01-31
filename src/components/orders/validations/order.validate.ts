import { HttpException, HttpStatus } from "@nestjs/common";
import { OrderHelper } from "src/common/helper";
import { BaCangType, BaoLoType, BonCangType, DanhDeType, DauDuoiType, LoTruocType, LoXienType, TroChoiThuViType } from "src/system/enums/lotteries";
import { ERROR } from '../../../system/constants/messageError';
import { MAX_ORDERS_LO2SO, MAX_ORDERS_LO3SO, MAX_ORDERS_LO4SO, MAX_ORDERS_DAU_DUOI, MAX_ORDERS_LOXIEN } from "src/system/constants";

export class OrderValidate {
    static validateOrders(orders: any, ordersBefore: Array<any>, turnIndex: string) {
        let numbers: any = [];
        let tempOrders = JSON.parse(JSON.stringify(orders));
        let orderDetailLo2SoGiaiDacBiet = '';

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

        for (const order of tempOrders) {
            if (order.turnIndex !== turnIndex) continue;

            switch (order.childBetType) {
                case BaoLoType.Lo2So:
                case BaoLoType.Lo2So1k:
                case DanhDeType.DeDau:
                case DanhDeType.DeDacBiet:
                case DanhDeType.DeDauDuoi:
                    const tempOrders2Digit = OrderHelper.getNumbersOfOrder2Digit(order.detail);
                    numbers = [...new Set([...numbers, ...tempOrders2Digit])]
                    if (numbers.length > MAX_ORDERS_LO2SO) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_LO_2_S0_INVALID,
                            },
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    break;

                case BaoLoType.Lo3So:
                case BaCangType.BaCangDau:
                case BaCangType.BaCangDacBiet:
                case BaCangType.BaCangDauDuoi:
                    const tempOrders3Digit = OrderHelper.getNumbersOfOrder3Digit(order.detail);
                    numbers = [...new Set([...numbers, ...tempOrders3Digit])]
                    if (numbers.length > MAX_ORDERS_LO3SO) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_LO_3_S0_INVALID,
                            },
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    break;

                case BaoLoType.Lo4So:
                case BonCangType.BonCangDacBiet:
                    const tempOrders4Digit = OrderHelper.getNumbersOfOrder4Digit(order.detail);
                    numbers = [...new Set([...numbers, ...tempOrders4Digit])]
                    if (numbers.length > MAX_ORDERS_LO4SO) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_LO_4_S0_INVALID,
                            },
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    break;

                case DauDuoiType.Dau:
                case DauDuoiType.Duoi:
                    const tempOrders2DigitDauDuoi = OrderHelper.getNumbersOfOrder2Digit(order.detail);
                    numbers = [...new Set([...numbers, ...tempOrders2DigitDauDuoi])]
                    if (numbers.length > MAX_ORDERS_DAU_DUOI) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_DAU_CUOI_INVALID,
                            },
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    break;

                case LoTruocType.TruotXien4:
                case LoTruocType.TruotXien8:
                case LoTruocType.TruotXien10:
                case LoXienType.Xien2:
                case LoXienType.Xien3:
                case LoXienType.Xien4:
                    const tempOrders = order.detail.split(',');
                    numbers = [...new Set([...numbers, ...tempOrders])];
                    if (numbers.length > MAX_ORDERS_LOXIEN) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_LO_2_S0_INVALID,
                            },
                            HttpStatus.BAD_REQUEST,
                        );
                    }
                    break;

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

                default:
                    break;
            }
        }
    }
}