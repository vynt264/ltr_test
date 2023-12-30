import { HttpException, HttpStatus } from "@nestjs/common";
import { OrderHelper } from "src/common/helper";
import { BaCangType, BaoLoType, BonCangType, DanhDeType, DauDuoiType } from "src/system/enums/lotteries";
import { ERROR } from '../../../system/constants/messageError';
import { MAX_ORDERS_LO2SO, MAX_ORDERS_LO3SO, MAX_ORDERS_LO4SO, MAX_ORDERS_DAU_DUOI } from "src/system/constants";

export class OrderValidate {
    static validateOrders(orders: any) {
        let numberOfOrders;
        for (const order of orders) {
            switch (order.childBetType) {
                case BaoLoType.Lo2So:
                case BaoLoType.Lo2So1k:
                case DanhDeType.DeDau:
                case DanhDeType.DeDacBiet:
                case DanhDeType.DeDauDuoi:
                    numberOfOrders = OrderHelper.getQuantityOrdersOf2Number(order.detail);
                    if (numberOfOrders > MAX_ORDERS_LO2SO) {
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
                    numberOfOrders = OrderHelper.getQuantityOrdersOf3Number(order.detail);
                    if (numberOfOrders > MAX_ORDERS_LO3SO) {
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
                    numberOfOrders = OrderHelper.getQuantityOrdersOf4Number(order.detail);
                    if (numberOfOrders > MAX_ORDERS_LO4SO) {
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
                    numberOfOrders = OrderHelper.getQuantityOrdersOf2Number(order.detail);
                    if (numberOfOrders > MAX_ORDERS_DAU_DUOI) {
                        throw new HttpException(
                            {
                                message: ERROR.MESSAGE_DAU_CUOI_INVALID,
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