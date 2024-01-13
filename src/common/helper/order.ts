import { addHours, startOfDay } from "date-fns";
import { DateTimeHelper } from "src/helpers/date-time";
import { INIT_TIME_CREATE_JOB, TypeLottery } from "src/system/constants";
import { BaCangType, BaoLoType, BetTypeName, BonCangType, CategoryLotteryType, CategoryLotteryTypeName, DanhDeType, DauDuoiType, Lo2SoGiaiDacBietType, LoTruocType, LoXienType, PricePerScore, TroChoiThuViType } from "src/system/enums/lotteries";

export class OrderHelper {
    static getQuantityOrdersOf2Number(ordersDetail: string) {
        if (!ordersDetail) return 0;

        let numberOfOrders = 0;
        let dozens;
        let numbersDozens;
        let unitRow;
        let numbersUnitRow;
        try {
            if ((ordersDetail.split('|').length - 1) === 1) {
                dozens = ordersDetail.split('|')[0];
                numbersDozens = dozens.split(',');
                unitRow = ordersDetail.split('|')[1];
                numbersUnitRow = unitRow.split(',');
                numberOfOrders = numbersDozens.length * numbersUnitRow.length;
            } else {
                const numbers = ordersDetail.split(',');
                numberOfOrders = numbers.length;
            }
        } catch (err) {
            numberOfOrders = 0;
        }

        return numberOfOrders;
    }

    static getQuantityOrdersOf3Number(ordersDetail: string) {
        if (!ordersDetail) return 0;

        let numberOfOrders = 0;
        let dozens;
        let numbersDozens;
        let unitRow;
        let numbersUnitRow;
        let hundreds;
        let numbersHundreds;

        try {
            if ((ordersDetail.split('|').length - 1) === 2) {
                dozens = ordersDetail.split('|')[0];
                numbersDozens = dozens.split(',');
                unitRow = ordersDetail.split('|')[1];
                numbersUnitRow = unitRow.split(',');
                hundreds = ordersDetail.split('|')[2];
                numbersHundreds = hundreds.split(',');
                numberOfOrders = numbersDozens.length * numbersUnitRow.length * numbersHundreds.length;
            } else {
                const numbers = ordersDetail.split(',');
                numberOfOrders = numbers.length;
            }
        } catch (error) {
            numberOfOrders = 0;
        }

        return numberOfOrders;
    }

    static getQuantityOrdersOf4Number(ordersDetail: string) {
        if (!ordersDetail) return 0;

        let numberOfOrders = 0;
        let dozens;
        let numbersDozens;
        let unitRow;
        let numbersUnitRow;
        let hundreds;
        let numbersHundreds;
        let unit;
        let numbersUnits;

        try {
            if ((ordersDetail.split('|').length - 1) === 3) {
                dozens = ordersDetail.split('|')[0];
                numbersDozens = dozens.split(',');
                unitRow = ordersDetail.split('|')[1];
                numbersUnitRow = unitRow.split(',');
                hundreds = ordersDetail.split('|')[2];
                numbersHundreds = hundreds.split(',');
                unit = ordersDetail.split('|')[3];
                numbersUnits = unit.split(',');
                numberOfOrders = numbersDozens.length * numbersUnitRow.length * numbersHundreds.length * numbersUnits.length;
            } else {
                const numbers = ordersDetail.split(',');
                numberOfOrders = numbers.length;
            }
        } catch (error) {
            numberOfOrders = 0;
        }

        return numberOfOrders;
    }

    static isValid2SoDacBiet(ordersDetail: string) {
        if (
            ordersDetail.includes(Lo2SoGiaiDacBietType.Tai)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.Xiu)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.Chan)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.Le)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.TongTai)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.TongXiu)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.TongChan)
            && ordersDetail.includes(Lo2SoGiaiDacBietType.TongLe)
        ) {
            return false;
        }

        return true;
    }

    static getWinningPatternsFromPrizes(prizes: any) {
        const result = [];
        const lastTwoDigits = prizes[0][0].slice(-2);
        let digitSum = 0;
        const digitArray = lastTwoDigits.split("");
        for (let i = 0; i < digitArray.length; i++) {
            digitSum += parseInt(digitArray[i]);
        }

        if (parseInt(lastTwoDigits) >= 50 && parseInt(lastTwoDigits) <= 99) {
            result.push(Lo2SoGiaiDacBietType.Tai);
        }

        if (parseInt(lastTwoDigits) >= 0 && parseInt(lastTwoDigits) < 50) {
            result.push(Lo2SoGiaiDacBietType.Xiu);
        }

        if (parseInt(lastTwoDigits) % 2 === 0) {
            result.push(Lo2SoGiaiDacBietType.Chan);
        }

        if (parseInt(lastTwoDigits) % 2 !== 0) {
            result.push(Lo2SoGiaiDacBietType.Le);
        }

        if (digitSum >= 10 && digitSum <= 18) {
            result.push(Lo2SoGiaiDacBietType.TongTai);
        }

        if (digitSum >= 0 && digitSum <= 8) {
            result.push(Lo2SoGiaiDacBietType.TongXiu);
        }

        if (digitSum % 2 === 0 && digitSum <= 18) {
            result.push(Lo2SoGiaiDacBietType.TongChan);
        }

        if (digitSum % 2 !== 0 && digitSum < 18) {
            result.push(Lo2SoGiaiDacBietType.TongLe);
        }

        switch (digitSum.toString()) {
            case '0':
                result.push(Lo2SoGiaiDacBietType.Tong0);
                break;
            case '1':
                result.push(Lo2SoGiaiDacBietType.Tong1);
                break;
            case '2':
                result.push(Lo2SoGiaiDacBietType.Tong2);
                break;
            case '3':
                result.push(Lo2SoGiaiDacBietType.Tong3);
                break;
            case '4':
                result.push(Lo2SoGiaiDacBietType.Tong4);
                break;
            case '5':
                result.push(Lo2SoGiaiDacBietType.Tong5);
                break;
            case '6':
                result.push(Lo2SoGiaiDacBietType.Tong6);
                break;
            case '7':
                result.push(Lo2SoGiaiDacBietType.Tong7);
                break;
            case '8':
                result.push(Lo2SoGiaiDacBietType.Tong8);
                break;
            case '9':
                result.push(Lo2SoGiaiDacBietType.Tong9);
                break;
            case '10':
                result.push(Lo2SoGiaiDacBietType.Tong10);
                break;
            case '11':
                result.push(Lo2SoGiaiDacBietType.Tong11);
                break;
            case '12':
                result.push(Lo2SoGiaiDacBietType.Tong12);
                break;
            case '13':
                result.push(Lo2SoGiaiDacBietType.Tong13);
                break;
            case '14':
                result.push(Lo2SoGiaiDacBietType.Tong14);
                break;
            case '15':
                result.push(Lo2SoGiaiDacBietType.Tong15);
                break;
            case '16':
                result.push(Lo2SoGiaiDacBietType.Tong16);
                break;
            case '17':
                result.push(Lo2SoGiaiDacBietType.Tong17);
                break;
            case '18':
                result.push(Lo2SoGiaiDacBietType.Tong18);
                break;

            default:
                break;
        }

        return result;
    }

    static getNumbersOfOrder2Digit(detail: string) {
        let str1;
        let numbers1;
        let str2;
        let numbers2;
        let numbers: any = [];

        try {
            str1 = detail.split('|')[0];
            numbers1 = str1.split(',');
            str2 = detail.split('|')[1];
            numbers2 = str2.split(',');
        } catch (error) { }

        if ((detail.split('|').length - 1) === 1) {
            for (const n1 of numbers1) {
                for (const n2 of numbers2) {
                    const number = `${n1.toString()}${n2.toString()}`;
                    numbers.push(number);
                }
            }
        } else {
            numbers = detail.split(',');
        }

        return numbers;
    }

    static getNumbersOfOrder3Digit(detail: string) {
        let str1;
        let numbers1;
        let str2;
        let numbers2;
        let str3;
        let numbers3;
        let numbers: any = [];

        try {
            str1 = detail.split('|')[0];
            numbers1 = str1.split(',');
            str2 = detail.split('|')[1];
            numbers2 = str2.split(',');
            str3 = detail.split('|')[2];
            numbers3 = str3.split(',');
        } catch (error) { }

        if ((detail.split('|').length - 1) === 2) {
            for (const n1 of numbers1) {
                for (const n2 of numbers2) {
                    for (const n3 of numbers3) {
                        const number = `${n1.toString()}${n2.toString()}${n3.toString()}`;
                        numbers.push(number);
                    }
                }
            }
        } else {
            numbers = detail.split(',');
        }

        return numbers;
    }

    static getNumbersOfOrder4Digit(detail: string) {
        let str1;
        let numbers1;
        let str2;
        let numbers2;
        let str3;
        let numbers3;
        let str4;
        let numbers4;
        let numbers: any = [];

        try {
            str1 = detail.split('|')[0];
            numbers1 = str1.split(',');
            str2 = detail.split('|')[1];
            numbers2 = str2.split(',');
            str3 = detail.split('|')[2];
            numbers3 = str3.split(',');
            str4 = detail.split('|')[3];
            numbers4 = str4.split(',');
        } catch (error) { }

        if ((detail.split('|').length - 1) === 3) {
            for (const n1 of numbers1) {
                for (const n2 of numbers2) {
                    for (const n3 of numbers3) {
                        for (const n4 of numbers4) {
                            const number = `${n1.toString()}${n2.toString()}${n3.toString()}${n4.toString()}`;
                            numbers.push(number);
                        }
                    }
                }
            }
        } else {
            numbers = detail.split(',');
        }

        return numbers;
    }

    static getNumbersOfLoXienAndTruot(detail: string) {
        let numbers: any = [];
        numbers = detail.split(',');
        numbers = numbers.map((number: string) => number.trim());
        numbers.sort((a: string, b: string) => {
            return parseInt(a) - parseInt(b);
        });

        numbers = [JSON.stringify(numbers)];

        return numbers;
    }

    static getNumbersOfDauDuoi(detail: string) {
        let numbers = detail.split(',');
        numbers = numbers.map((number: any) => number.trim());

        return numbers;
    }

    static getInfoDetailOfOrder(order: any) {
        let str1;
        let numbers1;
        let str2;
        let numbers2;
        let str3;
        let numbers3;
        let str4;
        let numbers4;
        let numbers: any = [];
        let betTypeName;
        let childBetTypeName;

        try {
            str1 = order.detail.split('|')[0];
            numbers1 = str1.split(',');
            str2 = order.detail.split('|')[1];
            numbers2 = str2.split(',');
            str3 = order.detail.split('|')[2];
            numbers3 = str3.split(',');
            str4 = order.detail.split('|')[3];
            numbers4 = str4.split(',');
        } catch (error) { }

        switch (order.betType) {
            case CategoryLotteryType.BaoLo:
                betTypeName = CategoryLotteryTypeName.BaoLo;

                switch (order.childBetType) {
                    case BaoLoType.Lo2So:
                        childBetTypeName = BetTypeName.Lo2So;
                        numbers = this.getNumbersOfOrder2Digit(order.detail);
                        break;

                    case BaoLoType.Lo2So1k:
                        childBetTypeName = BetTypeName.Lo2So1k;
                        numbers = this.getNumbersOfOrder2Digit(order.detail);
                        break;

                    case BaoLoType.Lo3So:
                        childBetTypeName = BetTypeName.Lo3So;
                        numbers = this.getNumbersOfOrder3Digit(order.detail);
                        break;

                    case BaoLoType.Lo4So:
                        childBetTypeName = BetTypeName.Lo4So;
                        numbers = this.getNumbersOfOrder4Digit(order.detail);
                        break;
                }
                break;

            case CategoryLotteryType.DanhDe:
                betTypeName = CategoryLotteryTypeName.DanhDe;

                switch (order.childBetType) {
                    case DanhDeType.DeDau:
                        childBetTypeName = BetTypeName.DeDau;
                        numbers = this.getNumbersOfOrder2Digit(order.detail);
                        break;

                    case DanhDeType.DeDacBiet:
                        childBetTypeName = BetTypeName.DeDacBiet;
                        numbers = this.getNumbersOfOrder2Digit(order.detail);
                        break;

                    case DanhDeType.DeDauDuoi:
                        numbers = this.getNumbersOfOrder2Digit(order.detail);
                        childBetTypeName = BetTypeName.DeDauDuoi;
                        break;
                }
                break;

            case CategoryLotteryType.DauDuoi:
                betTypeName = CategoryLotteryTypeName.DauDuoi;

                switch (order.childBetType) {
                    case DauDuoiType.Dau:
                        childBetTypeName = BetTypeName.Dau;
                        numbers = this.getNumbersOfDauDuoi(order.detail);
                        break;

                    case DauDuoiType.Duoi:
                        childBetTypeName = BetTypeName.Duoi;
                        numbers = this.getNumbersOfDauDuoi(order.detail);
                        break;
                }

                break;

            case CategoryLotteryType.Lo3Cang:
                betTypeName = CategoryLotteryTypeName.Lo3Cang;

                switch (order.childBetType) {
                    case BaCangType.BaCangDau:
                        childBetTypeName = BetTypeName.BaCangDau;
                        numbers = this.getNumbersOfOrder3Digit(order.detail);
                        break;

                    case BaCangType.BaCangDacBiet:
                        childBetTypeName = BetTypeName.BaCangDacBiet;
                        numbers = this.getNumbersOfOrder3Digit(order.detail);
                        break;

                    case BaCangType.BaCangDauDuoi:
                        childBetTypeName = BetTypeName.BaCangDauDuoi;
                        numbers = this.getNumbersOfOrder3Digit(order.detail);
                        break;
                }
                break;

            case CategoryLotteryType.Lo4Cang:
                betTypeName = CategoryLotteryTypeName.Lo4Cang;

                switch (order.childBetType) {
                    case BonCangType.BonCangDacBiet:
                        childBetTypeName = BetTypeName.BonCangDacBiet;
                        numbers = this.getNumbersOfOrder4Digit(order.detail);
                        break;
                }
                break;

            case CategoryLotteryType.LoTruot:
                betTypeName = CategoryLotteryTypeName.LoTruot;

                switch (order.childBetType) {
                    case LoTruocType.TruotXien4:
                        childBetTypeName = BetTypeName.TruotXien4;
                        numbers = this.getNumbersOfLoXienAndTruot(order.detail);
                        break;

                    case LoTruocType.TruotXien8:
                        childBetTypeName = BetTypeName.TruotXien8;
                        numbers = this.getNumbersOfLoXienAndTruot(order.detail);
                        break;

                    case LoTruocType.TruotXien10:
                        childBetTypeName = BetTypeName.TruotXien10;
                        numbers = this.getNumbersOfLoXienAndTruot(order.detail);
                        break;
                }
                break;

            case CategoryLotteryType.LoXien:
                betTypeName = CategoryLotteryTypeName.LoXien;

                switch (order.childBetType) {
                    case LoXienType.Xien2:
                        childBetTypeName = BetTypeName.Xien2;
                        numbers = this.getNumbersOfLoXienAndTruot(order.detail);
                        break;

                    case LoXienType.Xien3:
                        childBetTypeName = BetTypeName.Xien3;
                        numbers = this.getNumbersOfLoXienAndTruot(order.detail);
                        break;

                    case LoXienType.Xien4:
                        childBetTypeName = BetTypeName.Xien4;
                        numbers = this.getNumbersOfLoXienAndTruot(order.detail);
                        break;
                }
                break;

            case CategoryLotteryType.TroChoiThuVi:
                betTypeName = CategoryLotteryTypeName.TroChoiThuVi;

                switch (order.childBetType) {
                    case TroChoiThuViType.Lo2SoGiaiDacBiet:
                        childBetTypeName = BetTypeName.HaiSoDacBiet;
                        numbers = [order.detail];
                        break;
                }
                break;
        }

        return {
            numbers,
            betTypeName,
            childBetTypeName,
            numberOfBets: numbers.length,
        };
    }

    static getBetAmount(score: number, childBetType: string, numberOfBets: number) {
        let pricePerScore = 0;
        switch (childBetType) {
            case BaoLoType.Lo2So:
                pricePerScore = PricePerScore.Lo2So;
                break;

            case BaoLoType.Lo2So1k:
                pricePerScore = PricePerScore.Lo2So1k;
                break;

            case DanhDeType.DeDau:
                pricePerScore = PricePerScore.DeDau;
                break;

            case DanhDeType.DeDacBiet:
                pricePerScore = PricePerScore.DeDacBiet;
                break;

            case DanhDeType.DeDauDuoi:
                pricePerScore = PricePerScore.DeDauDuoi;
                break;

            case BaoLoType.Lo3So:
                pricePerScore = PricePerScore.Lo3So;
                break;

            case BaCangType.BaCangDau:
                pricePerScore = PricePerScore.BaCangDau;
                break;

            case BaCangType.BaCangDacBiet:
                pricePerScore = PricePerScore.BaCangDacBiet;
                break;

            case BaCangType.BaCangDauDuoi:
                pricePerScore = PricePerScore.BaCangDauDuoi;
                break;

            case BaoLoType.Lo4So:
                pricePerScore = PricePerScore.Lo4So;
                break;

            case BonCangType.BonCangDacBiet:
                pricePerScore = PricePerScore.BonCangDacBiet;
                break;

            case LoXienType.Xien2:
            case LoXienType.Xien3:
            case LoXienType.Xien4:
                pricePerScore = PricePerScore.Xien2;
                break;

            case LoTruocType.TruotXien4:
            case LoTruocType.TruotXien8:
            case LoTruocType.TruotXien10:
                pricePerScore = PricePerScore.TruotXien4;
                break;

            case DauDuoiType.Dau:
            case DauDuoiType.Duoi:
                pricePerScore = PricePerScore.Dau;
                break;

            case TroChoiThuViType.Lo2SoGiaiDacBiet:
                pricePerScore = PricePerScore.TroChoiThuVi;
                break;

            default:
                break;
        }

        return (pricePerScore * (score || 0) * numberOfBets);
    }

    static getCategoryLotteryTypeName(type: String) {

        let typeName = '';
        switch (type) {
            case CategoryLotteryType.BaoLo:
                typeName = CategoryLotteryTypeName.BaoLo;
                break;

            case CategoryLotteryType.LoXien:
                typeName = CategoryLotteryTypeName.LoXien;
                break;

            case CategoryLotteryType.DanhDe:
                typeName = CategoryLotteryTypeName.DanhDe;
                break;

            case CategoryLotteryType.DauDuoi:
                typeName = CategoryLotteryTypeName.DauDuoi;
                break;

            case CategoryLotteryType.Lo3Cang:
                typeName = CategoryLotteryTypeName.Lo3Cang;
                break;

            case CategoryLotteryType.Lo4Cang:
                typeName = CategoryLotteryTypeName.Lo4Cang;
                break;

            case CategoryLotteryType.LoTruot:
                typeName = CategoryLotteryTypeName.LoTruot;
                break;

            case CategoryLotteryType.TroChoiThuVi:
                typeName = CategoryLotteryTypeName.TroChoiThuVi;
                break;

            default:
                break;
        }

        return typeName;
    }

    static getRandomTradingCode() {
        let result = 'B';
        for (let i = 0; i < 20; i++) {
            result += Math.floor(Math.random() * 10);
        }

        return result;
    }

    static getBetTypeName(type: String) {

        let typeName = '';
        switch (type) {
            case BaoLoType.Lo2So:
                typeName = BetTypeName.Lo2So;
                break;

            case BaoLoType.Lo2So1k:
                typeName = BetTypeName.Lo2So1k;
                break;

            case BaoLoType.Lo3So:
                typeName = BetTypeName.Lo3So;
                break;

            case BaoLoType.Lo4So:
                typeName = BetTypeName.Lo4So;
                break;

            case LoXienType.Xien2:
                typeName = BetTypeName.Xien2;
                break;

            case LoXienType.Xien3:
                typeName = BetTypeName.Xien3;
                break;

            case LoXienType.Xien4:
                typeName = BetTypeName.Xien4;
                break;

            case DanhDeType.DeDau:
                typeName = BetTypeName.DeDau;
                break;

            case DanhDeType.DeDacBiet:
                typeName = BetTypeName.DeDacBiet;
                break;

            case DanhDeType.DeDauDuoi:
                typeName = BetTypeName.DeDauDuoi;
                break;

            case DauDuoiType.Dau:
                typeName = BetTypeName.Dau;
                break;

            case DauDuoiType.Duoi:
                typeName = BetTypeName.Duoi;
                break;

            case BaCangType.BaCangDau:
                typeName = BetTypeName.BaCangDau;
                break;

            case BaCangType.BaCangDacBiet:
                typeName = BetTypeName.BaCangDacBiet;
                break;

            case BaCangType.BaCangDauDuoi:
                typeName = BetTypeName.BaCangDauDuoi;
                break;

            case BonCangType.BonCangDacBiet:
                typeName = BetTypeName.BonCangDacBiet;
                break;

            case LoTruocType.TruotXien4:
                typeName = BetTypeName.TruotXien4;
                break;

            case LoTruocType.TruotXien8:
                typeName = BetTypeName.TruotXien8;
                break;

            case LoTruocType.TruotXien10:
                typeName = BetTypeName.TruotXien10;
                break;

            case TroChoiThuViType.Lo2SoGiaiDacBiet:
                typeName = BetTypeName.HaiSoDacBiet;
                break;

            default:
                break;
        }

        return typeName;
    }

    static getPlayingTimeByType(type: String) {

        let seconds = 0;
        switch (type) {
            case TypeLottery.XSMB_1S:
            case TypeLottery.XSMT_1S:
            case TypeLottery.XSMN_1S:
            case TypeLottery.XSSPL_1S:
                seconds = 1;
                break;

            case TypeLottery.XSMB_45S:
            case TypeLottery.XSMN_45S:
            case TypeLottery.XSMT_45S:
            case TypeLottery.XSSPL_45S:
                seconds = 45;
                break;

            case TypeLottery.XSSPL_60S:
                seconds = 60;
                break;

            case TypeLottery.XSSPL_90S:
                seconds = 90;
                break;

            case TypeLottery.XSSPL_120S:
                seconds = 120;
                break;

            case TypeLottery.XSMB_180S:
            case TypeLottery.XSMT_180S:
            case TypeLottery.XSMN_180S:
                seconds = 180;
                break;

            case TypeLottery.XSSPL_360S:
                seconds = 360;
                break;

            default:
                break;
        }

        return seconds;
    }

    static getTypeLottery(type: string) {
        let typeLottery;
        switch (type) {
            case TypeLottery.XSMB_1S:
            case TypeLottery.XSMB_45S:
            case TypeLottery.XSMB_180S:
                typeLottery = 'xsmb';
                break;

            case TypeLottery.XSMT_1S:
            case TypeLottery.XSMT_45S:
            case TypeLottery.XSMT_180S:
                typeLottery = 'xsmt';
                break;

            case TypeLottery.XSMN_1S:
            case TypeLottery.XSMN_45S:
            case TypeLottery.XSMN_180S:
                typeLottery = 'xsmn';
                break;

            case TypeLottery.XSSPL_1S:
            case TypeLottery.XSSPL_45S:
            case TypeLottery.XSSPL_60S:
            case TypeLottery.XSSPL_90S:
            case TypeLottery.XSSPL_120S:
            case TypeLottery.XSSPL_360S:
                typeLottery = 'xsspl';
                break;
        }

        return typeLottery;
    }

    static addOrder({ typeBet, childBetType, number, multiple, initData }: any) {
        let multipleTemp;
        if (initData[typeBet][childBetType][number]) {
            multipleTemp = initData[typeBet][childBetType][number] + multiple;
            initData[typeBet][childBetType][number] = multipleTemp;
        } else {
            multipleTemp = multiple;
        }

        initData[typeBet][childBetType][number] = multipleTemp;
    }

    static getBalance(orders: any) {
        let totalBet = 0;
        for (const order of orders) {
            const { numberOfBets } = OrderHelper.getInfoDetailOfOrder(order);
            let amount = 0;

            switch (order.childBetType) {
                case BaoLoType.Lo3So:
                    amount = (numberOfBets * PricePerScore.Lo3So) * order.multiple;
                    break;

                case BaoLoType.Lo2So:
                    amount = (numberOfBets * PricePerScore.Lo2So) * order.multiple;
                    break;

                case BaoLoType.Lo2So1k:
                    amount = (numberOfBets * PricePerScore.Lo2So1k) * order.multiple;
                    break;

                case BaoLoType.Lo4So:
                    amount = (numberOfBets * PricePerScore.Lo4So) * order.multiple;
                    break;

                case DanhDeType.DeDau:
                    amount = (numberOfBets * PricePerScore.DeDau) * order.multiple;
                    break;

                case DanhDeType.DeDacBiet:
                    amount = (numberOfBets * PricePerScore.DeDacBiet) * order.multiple;
                    break;

                case DanhDeType.DeDauDuoi:
                    amount = (numberOfBets * PricePerScore.DeDauDuoi) * order.multiple;
                    break;

                case BaCangType.BaCangDau:
                    amount = (numberOfBets * PricePerScore.BaCangDau) * order.multiple;
                    break;

                case BaCangType.BaCangDacBiet:
                    amount = (numberOfBets * PricePerScore.BaCangDacBiet) * order.multiple;
                    break;

                case BaCangType.BaCangDauDuoi:
                    amount = (numberOfBets * PricePerScore.BaCangDauDuoi) * order.multiple;
                    break;

                case BonCangType.BonCangDacBiet:
                    amount = (numberOfBets * PricePerScore.BonCangDacBiet) * order.multiple;
                    break;

                case LoXienType.Xien2:
                    amount = (numberOfBets * PricePerScore.Xien2) * order.multiple;
                    break;

                case LoXienType.Xien3:
                    amount = (numberOfBets * PricePerScore.Xien3) * order.multiple;
                    break;

                case LoXienType.Xien4:
                    amount = (numberOfBets * PricePerScore.Xien4) * order.multiple;
                    break;

                case LoTruocType.TruotXien4:
                    amount = (numberOfBets * PricePerScore.TruotXien4) * order.multiple;
                    break;

                case LoTruocType.TruotXien8:
                    amount = (numberOfBets * PricePerScore.TruotXien8) * order.multiple;
                    break;

                case LoTruocType.TruotXien10:
                    amount = (numberOfBets * PricePerScore.TruotXien10) * order.multiple;
                    break;

                case TroChoiThuViType.Lo2SoGiaiDacBiet:
                    amount = (numberOfBets * PricePerScore.TroChoiThuVi) * order.multiple;
                    break;

                default:
                    break;
            }

            totalBet += amount;
        }

        return totalBet;
    }

    static getTurnIndex(seconds: number) {
        const time = `${(new Date()).toLocaleDateString()}, ${INIT_TIME_CREATE_JOB}`;
        const fromDate = new Date(time).getTime();
        const toDate = (new Date()).getTime();
        const times = Math.ceil(((toDate - fromDate) / 1000) / seconds);

        return `${DateTimeHelper.formatDate(new Date())}-${times}`;
    }

    static getKeySaveUserIdsByBookmaker(bookmakerId: string) {
        return `bookmaker-id-${bookmakerId}-users`;
    }

    static getKeySaveUserIdsFakeByBookmaker(bookmakerId: string) {
        return `bookmaker-id-${bookmakerId}-fake-users`;
    }

    static getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId: string, gameType: string) {
        return `bookmaker-id-${bookmakerId}-${gameType}`;
    }

    static getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId: string, gameType: string) {
        return `bookmaker-id-${bookmakerId}-${gameType}-fake-users`;
    }

    static getKeySaveEachOrder(order: any) {
        return `${order.id.toString()}-${order.type}${order.seconds}s-${order.childBetType}`;
    }

    static getKeyPrepareOrders(bookmakerId: string, type: string, turnIndex: string) {
        return `${bookmakerId}-${type}-${turnIndex}`;
    }

    static getKeyPrepareOrdersOfTestPlayer(bookmakerId: string, type: string, turnIndex: string) {
        return `${bookmakerId}-${type}-${turnIndex}-test-player`;
    }

    static getCurrentTime(seconds: number) {
        const toDate = (new Date()).getTime();
        const secondsInCurrentRound = (toDate / 1000) % seconds;

        return secondsInCurrentRound;
    }

    static getCurrentTurnIndex(seconds: number) {
        const timeStartDay = startOfDay(new Date());
        const fromDate = addHours(timeStartDay, 7).getTime();
        const toDate = (new Date()).getTime();

        return Math.ceil(((toDate - fromDate) / 1000) / seconds);
    }

    static getOpenTime(seconds: number) {
        const toDate = (new Date()).getTime();
        const secondsInCurrentRound = (toDate / 1000) % seconds;

        return toDate - (secondsInCurrentRound * 1000);
    }

    static delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}