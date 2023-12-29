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
}