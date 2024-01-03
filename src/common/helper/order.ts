import { Lo2SoGiaiDacBietType } from "src/system/enums/lotteries";

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

    static getWinningTypeOfTroChoiThuVi(order: string, winningPatterns: any) {
        const item = winningPatterns.find((ord: any) => ord === order);


    }
}