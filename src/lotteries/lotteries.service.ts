import { Injectable } from '@nestjs/common';
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import {
  MAX_ORDERS_LO2SO,
  MAX_ORDERS_LO3SO,
  MAX_ORDERS_LO4SO,
  MAX_PERCENT,
  MINIUM_PROFIT,
  MAX_NUMBER_PRIZES_OF_LO2SO,
  MAX_NUMBER_PRIZES_OF_LO3SO,
  MAX_NUMBER_PRIZES_OF_LO4SO,
  PRIZES,
  MAX_ORDERS_LO2SO1K,
} from '../system/constants';
import { OrderDto } from './dto/order.dto';
import {
  BaCangType,
  BaoLoType,
  BonCangType,
  CategoryLotteryType,
  DanhDeType,
  DauDuoiType,
  Lo2SoGiaiDacBietType,
  LoTruocType,
  LoXienType,
  OddBet,
  PricePerScore,
  TroChoiThuViType,
} from '../system/enums/lotteries';

@Injectable()
export class LotteriesService {

  generatePrizes(orders: OrderDto[]) {
    const {
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
      ordersXien2,
      ordersXien3,
      ordersXien4,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      ordersDeDau,
      ordersDeDacBiet,
      ordersDeDauDuoi,
      ordersBaCangDacBiet,
      ordersBaCangDau,
      ordersBaCangDauDuoi,
      ordersBonCangDacBiet,
      ordersDau,
      ordersDuoi,
      ordersLo2SoGiaiDacBiet,
    } = this.transformOrdersNumber(orders);

    const whiteList = this.generateWhiteList({
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
    });

    const totalBetAmount = this.getTotalBetAmount(orders);
    console.log("Tong tien users dat cuoc", totalBetAmount);

    const finalResult = this.getPrizes({
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
      totalBetAmount,
      ordersXien2,
      ordersXien3,
      ordersXien4,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      ordersDeDau,
      ordersDeDacBiet,
      ordersDeDauDuoi,
      ordersBaCangDacBiet,
      ordersBaCangDau,
      ordersBaCangDauDuoi,
      ordersBonCangDacBiet,
      ordersDau,
      ordersDuoi,
      ordersLo2SoGiaiDacBiet,
    });

    return {
      // numbers,
      // percentProfit,
      // prizes,
      // whiteList,
      // mergeNumbers,
      // prizesFinal,
      // totalAmount
      finalResult
    };
  }

  create(createLotteryDto: CreateLotteryDto) {
    return 'This action adds a new lottery';
  }

  findAll() {
    return `This action returns all lotteries`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lottery`;
  }

  update(id: number, updateLotteryDto: UpdateLotteryDto) {
    return `This action updates a #${id} lottery`;
  }

  remove(id: number) {
    return `This action removes a #${id} lottery`;
  }

  calcPayoutPerOrderNumber({
    number,
    orders,
    oddBet,
    type,
  }: any) {

    let pricePerOrder = 0;
    let order;

    switch (type) {
      case BaoLoType.Lo2So:
      case BaoLoType.Lo2So1k:
      case BaoLoType.Lo3So:
      case BaoLoType.Lo4So:
      case DauDuoiType.Duoi:
      case BaCangType.BaCangDacBiet:
      case BaCangType.BaCangDauDuoi:
      case BonCangType.BonCangDacBiet:
      case DanhDeType.DeDauDuoi:
      case DanhDeType.DeDau:
      case BaCangType.BaCangDau:
      case BaCangType.BaCangDauDuoi:
        order = this.getOrderEndsWith(number, orders);
        break;

      case DauDuoiType.Dau:
        order = this.getOrderStartWith(number, orders);
        break;

      case TroChoiThuViType.Lo2SoGiaiDacBiet:
        break;

      default:
        break;
    }

    if (order) {
      pricePerOrder = (order?.score || 0) * (oddBet * 1000);
    }

    return pricePerOrder;
  }


  calcPayoutTroChoiThuVi({
    orders,
    lastTwoDigits,
  }: any) {
    let digitSum = 0;
    const digitArray = lastTwoDigits.split("");
    for (let i = 0; i < digitArray.length; i++) {
      digitSum += parseInt(digitArray[i]);
    }

    const result = [];
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

    let payOutLo2SoGiaiDacBiet = 0;
    for (const order of orders) {
      const item = result.find((ord: any) => ord === order?.number);
      if (item) {
        switch (order.number) {
          case Lo2SoGiaiDacBietType.Tai:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tai * 1000);
            break;

          case Lo2SoGiaiDacBietType.Xiu:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Xiu * 1000);
            break;

          case Lo2SoGiaiDacBietType.Chan:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Chan * 1000);
            break;

          case Lo2SoGiaiDacBietType.Le:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Le * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong0:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong0 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong1:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong1 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong2:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong2 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong3:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong3 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong4:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong4 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong5:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong5 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong6:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong6 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong7:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong7 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong8:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong8 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong9:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong9 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong10:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong10 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong11:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong11 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong12:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong12 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong13:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong13 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong14:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong14 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong15:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong15 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong16:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong16 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong17:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong17 * 1000);
            break;

          case Lo2SoGiaiDacBietType.Tong18:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.Tong18 * 1000);
            break;

          case Lo2SoGiaiDacBietType.TongTai:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.TongTai * 1000);
            break;

          case Lo2SoGiaiDacBietType.TongXiu:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.TongXiu * 1000);
            break;

          case Lo2SoGiaiDacBietType.TongChan:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.TongChan * 1000);
            break;

          case Lo2SoGiaiDacBietType.TongLe:
            payOutLo2SoGiaiDacBiet += (order?.score || 0) * (OddBet.TongLe * 1000);
            break;

          default:
            break;
        }
      }
    }

    return payOutLo2SoGiaiDacBiet;
  }

  generateOf9999Numbers() {
    const result: any = {};

    for (let i = 0; i <= 9999; i++) {
      const number = this.generate4DigitNumbers(i.toString());
      result[number] = 0;
    }

    return result;
  }

  generateOf99Numbers() {
    const result: any = {};

    for (let i = 0; i <= 99; i++) {
      const number = this.generate2DigitNumbers(i.toString());
      result[number] = 0;
    }

    return result;
  }


  generateOf999Numbers() {
    const result: any = {};

    for (let i = 0; i <= 999; i++) {
      const number = this.generate3DigitNumbers(i.toString());
      result[number] = 0;
    }

    return result;
  }

  calcPayoutOrders4So({
    ordersLo4So,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersLo4So) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo4So * 1000);
      arrayOf9999Numbers[order.number] += pricePerOrder;
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrders3So({
    ordersLo3So,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersLo3So) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo3So * 1000);

      for (let i = 0; i <= 9; i++) {
        const number = `${i.toString()}${order.number}`;
        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrders2So({
    ordersLo2So,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersLo2So) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo2So * 1000);

      for (let i = 0; i <= 99; i++) {
        let number = i.toString();
        if (number.length === 1) {
          number = `0${number}`;
        }

        number = `${number}${order.number}`;

        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrders2So1k({
    ordersLo2So1k,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersLo2So1k) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo2So1k * 1000);

      for (let i = 0; i <= 99; i++) {
        let number = i.toString();
        if (number.length === 1) {
          number = `0${number}`;
        }

        number = `${number}${order.number}`;

        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrdersDanhDeDacBiet({
    ordersDeDacBiet,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersDeDacBiet) {
      const pricePerOrder = (order?.score || 0) * (OddBet.DeDacBiet * 1000);

      for (let i = 0; i <= 99; i++) {
        let number = i.toString();
        if (number.length === 1) {
          number = `0${number}`;
        }

        number = `${number}${order.number}`;

        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrdersDanhDeDauDuoi({
    ordersDeDauDuoi,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersDeDauDuoi) {
      const pricePerOrder = (order?.score || 0) * (OddBet.DeDauDuoi * 1000);

      for (let i = 0; i <= 99; i++) {
        let number = i.toString();
        if (number.length === 1) {
          number = `0${number}`;
        }

        number = `${number}${order.number}`;

        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrders3CangDacBiet({
    ordersBaCangDacBiet,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersBaCangDacBiet) {
      const pricePerOrder = (order?.score || 0) * (OddBet.BaCangDacBiet * 1000);

      for (let i = 0; i <= 9; i++) {
        const number = `${i.toString()}${order.number}`;
        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrders3CangDauDuoi({
    ordersBaCangDauDuoi,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersBaCangDauDuoi) {
      const pricePerOrder = (order?.score || 0) * (OddBet.BaCangDauDuoi * 1000);

      for (let i = 0; i <= 9; i++) {
        const number = `${i.toString()}${order.number}`;
        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrders4CangDacBiet({
    ordersBonCangDacBiet,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersBonCangDacBiet) {
      const pricePerOrder = (order?.score || 0) * (OddBet.BonCangDacBiet * 1000);
      arrayOf9999Numbers[order.number] += pricePerOrder;
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrdersDau({
    ordersDau,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersDau) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Duoi * 1000);
      for (let i = 0; i <= 99; i++) {
        let number = i.toString();
        if (number.length === 1) {
          number = `0${number}`;
        }

        number = `${number}${order.number}`;

        for (let i = 0; i <= 9; i++) {
          const tempNumber = `${number}${i}`;
          arrayOf9999Numbers[tempNumber] += pricePerOrder;
        }
      }
    }

    return arrayOf9999Numbers;
  }

  calcPayoutOrdersDuoi({
    ordersDuoi,
    arrayOf9999Numbers,
  }: any) {
    for (const order of ordersDuoi) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Dau * 1000);
      for (let i = 0; i <= 999; i++) {
        let number = i.toString();
        if (number.length === 1) {
          number = `00${number}`;
        }

        if (number.length === 2) {
          number = `0${number}`;
        }

        number = `${number}${order.number}`;

        arrayOf9999Numbers[number] += pricePerOrder;
      }
    }

    return arrayOf9999Numbers;
  }

  generatePrizeSpecial({
    totalBetAmount,
    ordersLo2So,
    ordersLo2So1k,
    ordersLo3So,
    ordersLo4So,
    ordersDeDacBiet,
    ordersDeDauDuoi,
    ordersDau,
    ordersDuoi,
    ordersBaCangDacBiet,
    ordersBaCangDauDuoi,
    ordersBonCangDacBiet,
    ordersLo2SoGiaiDacBiet,
  }: any) {

    let arrayOf9999Numbers = this.generateOf9999Numbers();

    arrayOf9999Numbers = this.calcPayoutOrders4So({
      ordersLo4So,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders3So({
      ordersLo3So,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders2So({
      ordersLo2So,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders2So1k({
      ordersLo2So1k,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrdersDanhDeDacBiet({
      ordersDeDacBiet,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrdersDanhDeDauDuoi({
      ordersDeDauDuoi,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders3CangDacBiet({
      ordersBaCangDacBiet,
      arrayOf9999Numbers
    });

    arrayOf9999Numbers = this.calcPayoutOrders3CangDauDuoi({
      ordersBaCangDauDuoi,
      arrayOf9999Numbers
    });


    arrayOf9999Numbers = this.calcPayoutOrders4CangDacBiet({
      ordersBonCangDacBiet,
      arrayOf9999Numbers
    });

    arrayOf9999Numbers = this.calcPayoutOrdersDau({
      ordersDau,
      arrayOf9999Numbers
    });

    arrayOf9999Numbers = this.calcPayoutOrdersDuoi({
      ordersDuoi,
      arrayOf9999Numbers,
    });

    for (const key of Object.keys(arrayOf9999Numbers)) {
      const lastTwoDigits = key.slice(-2);
      const payOutLo2SoGiaiDacBiet = this.calcPayoutTroChoiThuVi({ lastTwoDigits, orders: ordersLo2SoGiaiDacBiet });

      arrayOf9999Numbers[key] += (payOutLo2SoGiaiDacBiet);
    }

    let result = [];
    for (const key of Object.keys(arrayOf9999Numbers)) {
      result.push({
        number: key,
        payOut: arrayOf9999Numbers[key]
      });
    }

    // result = result.filter((prize: any) => (prize.payOut < totalBetAmount && prize.payOut != 0));
    result.sort((a: any, b: any) => a.payOut - b.payOut);

    return result;
  }

  generatePrize8({
    totalBetAmount,
    ordersLo2So,
    ordersLo2So1k,
    ordersDeDau,
    ordersDeDauDuoi
  }: any) {
    let prizes8 = [];
    let arrayOf99Numbers = this.generateOf99Numbers();

    for (const order of ordersLo2So) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo2So * 1000);

      arrayOf99Numbers[order.number] += pricePerOrder;
    }

    for (const order of ordersLo2So1k) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo2So1k * 1000);

      arrayOf99Numbers[order.number] += pricePerOrder;
    }


    for (const order of ordersDeDau) {
      const pricePerOrder = (order?.score || 0) * (OddBet.DeDau * 1000);

      arrayOf99Numbers[order.number] += pricePerOrder;
    }

    for (const order of ordersDeDauDuoi) {
      const pricePerOrder = (order?.score || 0) * (OddBet.DeDauDuoi * 1000);

      arrayOf99Numbers[order.number] += pricePerOrder;
    }

    let result = [];
    for (const key of Object.keys(arrayOf99Numbers)) {
      result.push({
        number: key,
        payOut: arrayOf99Numbers[key]
      });
    }

    result.sort((a: any, b: any) => a.payOut - b.payOut);

    return result;
  }

  generatePrize7({
    totalBetAmount,
    ordersLo2So,
    ordersLo2So1k,
    ordersLo3So,
    ordersBaCangDau,
    ordersBaCangDauDuoi,
  }: any) {

    let arrayOf999Numbers = this.generateOf999Numbers();
    for (const order of ordersLo2So) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo2So * 1000);

      for (let i = 0; i <= 9; i++) {
        const number = `${i.toString()}${order.number}`;
        arrayOf999Numbers[number] += pricePerOrder;
      }
    }

    for (const order of ordersLo2So1k) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo2So1k * 1000);

      for (let i = 0; i <= 9; i++) {
        const number = `${i.toString()}${order.number}`;
        arrayOf999Numbers[number] += pricePerOrder;
      }
    }

    for (const order of ordersLo3So) {
      const pricePerOrder = (order?.score || 0) * (OddBet.Lo3So * 1000);

      arrayOf999Numbers[order?.number] += pricePerOrder;
    }

    for (const order of ordersBaCangDau) {
      const pricePerOrder = (order?.score || 0) * (OddBet.BaCangDau * 1000);

      arrayOf999Numbers[order?.number] += pricePerOrder;
    }

    for (const order of ordersBaCangDauDuoi) {
      const pricePerOrder = (order?.score || 0) * (OddBet.BaCangDauDuoi * 1000);

      arrayOf999Numbers[order?.number] += pricePerOrder;
    }

    let result = [];
    for (const key of Object.keys(arrayOf999Numbers)) {
      result.push({
        number: key,
        payOut: arrayOf999Numbers[key]
      });
    }

    result.sort((a: any, b: any) => a.payOut - b.payOut);

    return result;
  }

  generateRemainPrizes({
    finalResult,
    totalBetAmount,
    ordersLo2So,
    ordersLo2So1k,
    ordersLo3So,
    ordersLo4So,
  }: any) {

    let arrayOf9999Numbers = this.generateOf9999Numbers();

    arrayOf9999Numbers = this.calcPayoutOrders4So({
      ordersLo4So,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders3So({
      ordersLo3So,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders2So({
      ordersLo2So,
      arrayOf9999Numbers,
    });

    arrayOf9999Numbers = this.calcPayoutOrders2So1k({
      ordersLo2So1k,
      arrayOf9999Numbers,
    });

    let result = [];
    for (const key of Object.keys(arrayOf9999Numbers)) {
      result.push({
        number: key,
        payOut: arrayOf9999Numbers[key]
      });
    }

    // result = result.filter((prize: any) => (prize.payOut < totalBetAmount && prize.payOut != 0));
    result.sort((a: any, b: any) => a.payOut - b.payOut);

    return result;
  }

  checkXien({
    ordersXien2,
    ordersXien3,
    ordersXien4,
    prizesFinal,
    number,
    mergeResult,
  }: any) {
    const resultXien2 = this.checkXien2(ordersXien2, prizesFinal, number);
    if (resultXien2.length > 0) {
      mergeResult = mergeResult.map((n: any) => {
        const lastTwoDigits = n?.number.slice(-2);
        const ord = resultXien2.find((item: any) => item.number === lastTwoDigits);
        if (ord) {
          if (
            (
              (!n?.xienUpdated?.index && n?.xienUpdated?.index != 0)
              || n?.xienUpdated?.index !== ord?.index
            )
          ) {
            n.payOut += (ord?.score || 0) * (OddBet.Xien2 * 1000);
            n.xienUpdated = {
              index: ord.index,
              type: ord.type,
            };
          }
        }

        return n;
      });
    }

    const resultXien3 = this.checkXien3(ordersXien3, prizesFinal, number);
    if (resultXien3.length > 0) {
      mergeResult = mergeResult.map((n: any) => {
        const lastTwoDigits = n?.number.slice(-2);
        const ord = resultXien3.find((item: any) => item.number === lastTwoDigits);

        if (ord) {
          if (
            (
              (!n?.xienUpdated?.index && n?.xienUpdated?.index != 0)
              || n?.xienUpdated?.index !== ord?.index
            )
          ) {
            n.payOut += (ord?.score || 0) * (OddBet.Xien3 * 1000);
            n.xienUpdated = {
              index: ord.index,
              type: ord.type,
            };
          }
        }

        return n;
      });
    }

    const resultXien4 = this.checkXien4(ordersXien4, prizesFinal, number);
    if (resultXien4.length > 0) {
      mergeResult = mergeResult.map((n: any) => {
        const lastTwoDigits = n?.number.slice(-2);
        const ord = resultXien4.find((item: any) => item.number === lastTwoDigits);
        if (ord) {
          if (
            (
              (!n?.xienUpdated?.index && n?.xienUpdated?.index != 0)
              || n?.xienUpdated?.index !== ord?.index
            )
          ) {
            n.payOut += (ord?.score || 0) * (OddBet.Xien4 * 1000);
            n.xienUpdated = {
              index: ord.index,
              type: ord.type,
            };
          }
        }

        return n;
      });
    }
  }

  checkLoTruot({
    totalBetAmount,
    finalResult,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    prizes,
  }: any) {
    ordersTruotXien4 = ordersTruotXien4.reduce((result: any, currentValue: any) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        totalBetAmount += (OddBet.XienTruot4 * 1000 * (currentValue?.score || 0));
      } else {
        result.push(currentValue);
      }

      return result;
    }, []);

    for (const orders of ordersTruotXien4) {
      const firstItem = orders.number[0];
      const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));
      for (const prize of prizes) {
        const exist = prize?.number?.endsWith(firstItem);
        if (exist && !hasInFinalResult) {
          prize.payOut -= ((orders.score || 0) * (OddBet.XienTruot4 * 1000));
        }
      }
    }

    //
    ordersTruotXien8 = ordersTruotXien8.reduce((result: any, currentValue: any) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        totalBetAmount += (OddBet.XienTruot8 * 1000 * (currentValue?.score || 0));
      } else {
        result.push(currentValue);
      }

      return result;
    }, []);

    for (const orders of ordersTruotXien8) {
      const firstItem = orders.number[0];
      const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));
      for (const prize of prizes) {
        const exist = prize?.number?.endsWith(firstItem);
        if (exist && !hasInFinalResult) {
          prize.payOut -= ((orders.score || 0) * (OddBet.XienTruot8 * 1000));
        }
      }
    }

    //
    ordersTruotXien10 = ordersTruotXien10.reduce((result: any, currentValue: any) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }
      if (exist) {
        totalBetAmount += (OddBet.XienTruot10 * 1000 * (currentValue?.score || 0));
      } else {
        result.push(currentValue);
      }

      return result;
    }, []);

    for (const orders of ordersTruotXien10) {
      const firstItem = orders.number[0];
      const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));
      for (const prize of prizes) {
        const exist = prize?.number?.endsWith(firstItem);
        if (exist && !hasInFinalResult) {
          prize.payOut -= ((orders.score || 0) * (OddBet.XienTruot10 * 1000));
        }
      }
    }

    prizes.sort((a: any, b: any) => a.payOut - b.payOut);

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes,
    };
  }

  getFinalPrize({
    prizesSpecial,
    prizes8,
    prizes7,
    remainPrizes,
    totalBetAmount,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    ordersXien2,
    ordersXien3,
    ordersXien4,
  }: any) {

    // get prize special
    let totalPayout = 0;
    let finalPrizeSpecial: any = [];
    let prizesSpecial1;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizesSpecial1,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: finalPrizeSpecial,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizesSpecial,
    }));
    finalPrizeSpecial = [prizesSpecial1[0]];
    totalPayout += finalPrizeSpecial[0].payOut;

    // get prize 8
    let prizes81;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizes81,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: finalPrizeSpecial,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizes8,
    }));

    let count = 0;
    const prizesSpecialAnd8 = [];
    prizes81 = [...finalPrizeSpecial, ...prizes81];
    for (const order of prizes81) {
      if (count === 2) break;

      if ((totalPayout + order?.payOut) >= ((totalBetAmount * 95) / 100)) {
        continue;
      }

      let lastTwoDigits = order?.number.slice(-2);
      prizesSpecialAnd8.push(order);
      count++;
      totalPayout += order?.payOut;

      this.checkXien({
        ordersXien2,
        ordersXien3,
        ordersXien4,
        prizesFinal: prizesSpecialAnd8,
        mergeResult: prizes81,
        number: lastTwoDigits,
      });
    }


    // get prize 7
    let prizes71;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizes71,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: prizesSpecialAnd8,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizes7,
    }));

    prizes71 = [...prizesSpecialAnd8, ...prizes71];
    let count1 = 0;
    const prizesSpecialAnd8And7 = [];
    for (const order of prizes71) {
      if (count1 === 3) break;

      if ((totalPayout + order?.payOut) >= ((totalBetAmount * 95) / 100)) {
        continue;
      }

      let lastTwoDigits = order?.number.slice(-2);
      prizesSpecialAnd8And7.push(order);
      count1++;
      totalPayout += order?.payOut;

      this.checkXien({
        ordersXien2,
        ordersXien3,
        ordersXien4,
        prizesFinal: prizesSpecialAnd8And7,
        mergeResult: prizes71,
        number: lastTwoDigits,
      });
    }

    // get remain prizes
    let remainPrizes1;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: remainPrizes1,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: prizesSpecialAnd8And7,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: remainPrizes,
    }));

    remainPrizes1 = [...prizesSpecialAnd8And7, ...remainPrizes1];
    let count2 = 0;
    const allPrizes = [];

    for (const order of remainPrizes1) {
      if (count2 === 18) break;

      if ((totalPayout + order?.payOut) >= ((totalBetAmount * 95) / 100)) {
        continue;
      }

      let lastTwoDigits = order?.number.slice(-2);
      allPrizes.push(order);
      count2++;
      totalPayout += order?.payOut;

      this.checkXien({
        ordersXien2,
        ordersXien3,
        ordersXien4,
        prizesFinal: allPrizes,
        mergeResult: remainPrizes1,
        number: lastTwoDigits,
      });
    }

    return allPrizes;
  }

  getPrizes({
    ordersLo2So,
    ordersLo2So1k,
    ordersLo3So,
    ordersLo4So,
    totalBetAmount,
    ordersXien2,
    ordersXien3,
    ordersXien4,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    ordersDeDau,
    ordersDeDacBiet,
    ordersDeDauDuoi,
    ordersBaCangDacBiet,
    ordersBaCangDau,
    ordersBaCangDauDuoi,
    ordersBonCangDacBiet,
    ordersDau,
    ordersDuoi,
    ordersLo2SoGiaiDacBiet,
  }: any) {
    let finalResult: any = [];
    const totalAmountLoXienTruot = this.getTotalAmountLoXienTruot({
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
    });
    totalBetAmount = totalBetAmount - totalAmountLoXienTruot;

    let prizesSpecial = this.generatePrizeSpecial({
      totalBetAmount,
      totalAmountLoXienTruot,
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
      ordersDeDacBiet,
      ordersDeDauDuoi,
      ordersDau,
      ordersDuoi,
      ordersBaCangDacBiet,
      ordersBaCangDauDuoi,
      ordersBonCangDacBiet,
      ordersLo2SoGiaiDacBiet,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
    });
    // prizesSpecial = prizesSpecial.filter((prize: any) => (prize.payOut !== 0));

    let prizes8 = this.generatePrize8({
      finalResult,
      totalBetAmount,
      ordersLo2So,
      ordersLo2So1k,
      ordersDeDau,
      ordersDeDauDuoi,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      ordersXien2,
      ordersXien3,
      ordersXien4,
    });
    // prizes8 = prizes8.filter((prize: any) => (prize.payOut !== 0));

    let prizes7 = this.generatePrize7({
      finalResult,
      totalBetAmount,
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersBaCangDau,
      ordersBaCangDauDuoi,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      ordersXien2,
      ordersXien3,
      ordersXien4,
    });
    // prizes7 = prizes7.filter((prize: any) => (prize.payOut !== 0));

    let remainPrizes = this.generateRemainPrizes({
      finalResult,
      totalBetAmount,
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      ordersXien2,
      ordersXien3,
      ordersXien4,
    });
    // remainPrizes = remainPrizes.filter((prize: any) => (prize.payOut !== 0));


    // finalResult = this.getFinalPrize({
    //   prizesSpecial,
    //   prizes8,
    //   prizes7,
    //   remainPrizes,
    //   totalBetAmount,
    //   ordersTruotXien4,
    //   ordersTruotXien8,
    //   ordersTruotXien10,
    //   ordersXien2,
    //   ordersXien3,
    //   ordersXien4,
    // });

    let limit = 5;
    let count = 1;
    const result: any = [];

    while (true) {
      let tempPrizesSpecial = JSON.parse(JSON.stringify(prizesSpecial));
      let tempPrize8 = JSON.parse(JSON.stringify(prizes8));
      let tempPrize7 = JSON.parse(JSON.stringify(prizes7));
      let tempRemainPrizes = JSON.parse(JSON.stringify(remainPrizes));
      let tempOrdersTruotXien4 = JSON.parse(JSON.stringify(ordersTruotXien4));
      let tempOrdersTruotXien8 = JSON.parse(JSON.stringify(ordersTruotXien8));
      let tempOrdersTruotXien10 = JSON.parse(JSON.stringify(ordersTruotXien10));
      let tempOrdersXien2 = JSON.parse(JSON.stringify(ordersXien2));
      let tempOrdersXien3 = JSON.parse(JSON.stringify(ordersXien3));
      let tempOrdersXien4 = JSON.parse(JSON.stringify(ordersXien4));

      if (limit === 0) break;

      if (limit !== 5) {
        // tempPrizesSpecial = tempPrizesSpecial.filter((prize: any) => (prize.payOut !== 0));
        tempPrizesSpecial.sort(this.compareRandom);

        // tempPrize8 = tempPrize8.filter((prize: any) => (prize.payOut !== 0));
        tempPrize8.sort(this.compareRandom);

        // tempPrize7 = tempPrize7.filter((prize: any) => (prize.payOut !== 0));
        tempPrize7.sort(this.compareRandom);

        // tempRemainPrizes = tempRemainPrizes.filter((prize: any) => (prize.payOut !== 0));
        tempRemainPrizes.sort(this.compareRandom);
      }

      finalResult = this.getFinalPrize({
        prizesSpecial: tempPrizesSpecial,
        prizes8: tempPrize8,
        prizes7: tempPrize7,
        remainPrizes: tempRemainPrizes,
        totalBetAmount,
        ordersTruotXien4: tempOrdersTruotXien4,
        ordersTruotXien8: tempOrdersTruotXien8,
        ordersTruotXien10: tempOrdersTruotXien10,
        ordersXien2: tempOrdersXien2,
        ordersXien3: tempOrdersXien3,
        ordersXien4: tempOrdersXien4,
      });

      result.push({
        [`time-${count}`]: finalResult,
      });

      limit--;
      count++;
    }

    let count1 = 1;
    const result1 = result.reduce((res: any, currentValue: any) => {
      let totalPayout = 0;
      for (const value of currentValue[`time-${count1}`]) {
        totalPayout += value.payOut;
      }

      res.push({
        totalPayout,
        values: currentValue[`time-${count1}`],
      })
      count1++;

      return res;
    }, []);

    return result1;
  }

  checkXien2(ordersXien2: any, prizesFinal: any, currentNumber: any) {
    const tempResult: any = [];
    ordersXien2.forEach((orderXien2: any, index: any) => {
      const exist = orderXien2?.number.some((n: any) => currentNumber.endsWith(n));
      if (exist) {
        orderXien2.index = index;
        orderXien2.type = "xien-2";
        tempResult.push(orderXien2);
      }
    });

    const finalResult = [];
    for (const orderXien2 of tempResult) {
      let count = 0;
      let tempNumber;
      for (const num of orderXien2?.number) {
        const exist = prizesFinal.some((n: any) => n?.number.endsWith(num));
        if (exist) {
          count++;
        } else {
          tempNumber = num;
        }
      }

      if (count === 1) {
        finalResult.push({
          number: tempNumber,
          score: orderXien2.score,
          payOut: orderXien2.payOut,
          index: orderXien2.index,
          type: 'xien-2',
          numberXien: orderXien2.number,
        });
      }
    }

    return finalResult;
  }

  checkXien3(ordersXien3: any, prizesFinal: any, currentNumber: any) {
    const tempResult: any = [];
    ordersXien3.forEach((orderXien3: any, index: any) => {
      const exist = orderXien3?.number.some((n: any) => currentNumber.endsWith(n));
      if (exist) {
        orderXien3.index = index;
        orderXien3.type = "xien-3";
        tempResult.push(orderXien3);
      }
    });

    const finalResult = [];
    for (const orderXien3 of tempResult) {
      let count = 0;
      let tempNumber;
      for (const num of orderXien3?.number) {
        const exist = prizesFinal.some((n: any) => n?.number.endsWith(num));
        if (exist) {
          count++;
        } else {
          tempNumber = num;
        }
      }

      if (count === 2) {
        finalResult.push({
          number: tempNumber,
          score: orderXien3.score,
          payOut: orderXien3.payOut,
          index: orderXien3.index,
          type: 'xien-3',
          numberXien: orderXien3.number,
        });
      }
    }

    return finalResult;
  }

  checkXien4(ordersXien4: any, prizesFinal: any, currentNumber: any) {
    const tempResult: any = [];
    ordersXien4.forEach((orderXien4: any, index: any) => {
      const exist = orderXien4?.number.some((n: any) => currentNumber.endsWith(n));
      if (exist) {
        orderXien4.index = index;
        orderXien4.type = "xien-4";
        tempResult.push(orderXien4);
      }
    });

    const finalResult = [];
    for (const orderXien4 of tempResult) {
      let count = 0;
      let tempNumber;
      for (const num of orderXien4?.number) {
        const exist = prizesFinal.some((n: any) => n?.number.endsWith(num));
        if (exist) {
          count++;
        } else {
          tempNumber = num;
        }
      }

      if (count === 3) {
        finalResult.push({
          number: tempNumber,
          score: orderXien4.score,
          payOut: orderXien4.payOut,
          index: orderXien4.index,
          type: 'xien-4',
          numberXien: orderXien4.number,
        });
      }
    }

    return finalResult;
  }

  getTotalAmountLoXienTruot({
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
  }: any) {
    let totalAmountLoXienTruot = 0;

    // truot 4
    for (const order of ordersTruotXien4) {
      const pricePerOrderTruotXien4 = (order?.score || 0) * (OddBet.XienTruot4 * 1000);
      totalAmountLoXienTruot += pricePerOrderTruotXien4;
    }

    // truot 8
    for (const order of ordersTruotXien8) {
      const pricePerOrderTruotXien8 = (order?.score || 0) * (OddBet.XienTruot8 * 1000);
      totalAmountLoXienTruot += pricePerOrderTruotXien8;
    }

    // truot 10
    for (const order of ordersTruotXien10) {
      const pricePerOrderTruotXien10 = (order?.score || 0) * (OddBet.XienTruot10 * 1000);
      totalAmountLoXienTruot += pricePerOrderTruotXien10;
    }

    return totalAmountLoXienTruot;
  }

  randomPrizes({ matricPrizes, numbers }: any) {

    const prize8 = [];
    const prize7 = [];
    const prize6 = [];
    const prize5 = [];
    const prize4 = [];
    const prize3 = [];
    const prize2 = [];
    const prize1 = [];
    const specialPrize = [];

    for (const n of numbers) {
      if (prize8.length === 0) {
        if (n.length === 2) {
          prize8.push(n);
          continue;
        }
      }

      if (prize7.length === 0) {
        if (n.length === 3) {
          prize7.push(n);
          continue;
        }
      }

      if (prize6.length < 3) {
        prize6.push(n);
        continue;
      }

      if (prize5.length === 0) {
        prize5.push(n);
        continue;
      }

      if (prize4.length < 7) {
        prize4.push(n);
        continue;
      }

      if (prize3.length < 2) {
        prize3.push(n);
        continue;
      }

      if (prize2.length === 0) {
        prize2.push(n);
        continue;
      }

      if (prize1.length === 0) {
        prize1.push(n);
        continue;
      }

      if (specialPrize.length === 0) {
        specialPrize.push(n);
        continue;
      }
    }

    console.log("random prizes success.");

    return {
      [PRIZES.SPECIAL_PRIZE]: specialPrize,
      [PRIZES.PRIZE_1]: prize1,
      [PRIZES.PRIZE_2]: prize2,
      [PRIZES.PRIZE_3]: prize3,
      [PRIZES.PRIZE_4]: prize4,
      [PRIZES.PRIZE_5]: prize5,
      [PRIZES.PRIZE_6]: prize6,
      [PRIZES.PRIZE_7]: prize7,
      [PRIZES.PRIZE_8]: prize8,
    };
  }

  getOrderEndsWith(number: any, orders: any) {
    if (!number || !orders || orders.length === 0) return;

    for (const order of orders) {
      const exist = number.endsWith(order?.number);

      if (exist) return order;
    }

    return;
  }

  getOrderStartWith(number: any, orders: any) {
    if (!number || !orders || orders.length === 0) return;

    for (const order of orders) {
      const exist = number.startsWith(order?.number);

      if (exist) return order;
    }

    return;
  }

  generateWhiteList({
    ordersLo2So,
    ordersLo2So1k,
    ordersLo3So,
    ordersLo4So,
  }: any): any {

    const whiteList = {
      [BaoLoType.Lo4So]: [],
      [BaoLoType.Lo3So]: [],
      [BaoLoType.Lo2So]: [],
    } as any;

    for (let i = 0; i < MAX_ORDERS_LO4SO; i++) {
      let tempNum = i.toString();
      if (tempNum.length < 4) {
        const tempLength = 4 - tempNum.length;
        for (let i = 0; i < tempLength; i++) {
          tempNum = '0' + tempNum;
        }
      }

      const hasInDataLo4So = ordersLo4So.some((n: any) => tempNum.endsWith(n?.number));
      const hasInDataLo3So = ordersLo3So.some((n: any) => tempNum.endsWith(n?.number));
      const hasInDataLo2So = ordersLo2So.some((n: any) => tempNum.endsWith(n?.number));
      const hasInDataLo2So1k = ordersLo2So1k.some((n: any) => tempNum.endsWith(n?.number));

      if (!hasInDataLo4So && !hasInDataLo3So && !hasInDataLo2So && !hasInDataLo2So1k) {
        whiteList?.[BaoLoType.Lo4So].push(tempNum);
      }
    }

    for (let i = 0; i < MAX_ORDERS_LO3SO; i++) {
      let tempNum = i.toString();
      if (tempNum.length < 3) {
        const tempLength = 3 - tempNum.length;
        for (let i = 0; i < tempLength; i++) {
          tempNum = '0' + tempNum;
        }
      }

      const hasInDataLo3So = ordersLo3So.some((n: any) => tempNum.endsWith(n?.number));
      const hasInDataLo2So = ordersLo2So.some((n: any) => tempNum.endsWith(n?.number));
      const hasInDataLo2So1k = ordersLo2So1k.some((n: any) => tempNum.endsWith(n?.number));

      if (!hasInDataLo3So && !hasInDataLo2So && !hasInDataLo2So1k) {
        whiteList?.[BaoLoType.Lo3So].push(tempNum);
      }
    }

    for (let i = 0; i < MAX_ORDERS_LO2SO; i++) {
      let tempNum = i.toString();
      if (tempNum.length === 1) {
        tempNum = `0${tempNum}`;
      }

      const hasInDataLo2So = ordersLo2So.some((n: any) => n?.number === tempNum);
      const hasInDataLo2So1k = ordersLo2So1k.some((n: any) => n?.number === tempNum);

      if (!hasInDataLo2So && !hasInDataLo2So1k) {
        whiteList?.[BaoLoType.Lo2So].push(tempNum);
      }
    }

    return whiteList;
  }

  generate2DigitNumbers(order: any) {
    if (order.toString().length === 1) {
      order = `0${order}`
    } else {
      order = order.toString();
    }

    return order;
  }

  generate3DigitNumbers(order: any) {
    if (order.toString().length === 1) {
      order = `00${order}`
    } else if (order.toString().length === 2) {
      order = `0${order}`
    } else {
      order = order.toString();
    }

    return order;
  }

  generate4DigitNumbers(order: any) {
    if (order.toString().length === 1) {
      order = `000${order}`
    } else if (order.toString().length === 2) {
      order = `00${order}`
    } else if (order.toString().length === 3) {
      order = `0${order}`
    } else {
      order = order.toString();
    }

    return order;
  }

  transformOrdersNumber(orders: any): any {
    if (!orders || orders.length === 0) return [];

    let ordersLo2So: any = [];
    let ordersLo2So1k: any = [];
    let ordersLo3So: any = [];
    let ordersLo4So: any = [];
    let ordersXien2: any = [];
    let ordersXien3: any = [];
    let ordersXien4: any = [];
    let ordersTruotXien4: any = [];
    let ordersTruotXien8: any = [];
    let ordersTruotXien10: any = [];
    let ordersDeDau: any = [];
    let ordersDeDacBiet: any = [];
    let ordersDeDauDuoi: any = [];
    let ordersBonCangDacBiet: any = [];
    let ordersBaCangDacBiet: any = [];
    let ordersBaCangDauDuoi: any = [];
    let ordersBaCangDau: any = [];
    let ordersDau: any = [];
    let ordersDuoi: any = [];
    let ordersLo2SoGiaiDacBiet: any = [];

    for (const order of orders) {
      switch (order?.categoryLotteryType) {
        case CategoryLotteryType.BaoLo:
          for (const orderOfBalo of order?.data) {
            switch (orderOfBalo?.type) {
              case BaoLoType.Lo2So:
                orderOfBalo?.data?.map((order: any) => {
                  order.number = this.generate2DigitNumbers(order?.number);

                  return order;
                });
                ordersLo2So = orderOfBalo?.data;
                break;

              case BaoLoType.Lo2So1k:
                orderOfBalo?.data?.map((order: any) => {
                  order.number = this.generate2DigitNumbers(order?.number);

                  return order;
                });

                ordersLo2So1k = orderOfBalo?.data;
                break;

              case BaoLoType.Lo3So:
                orderOfBalo?.data?.map((order: any) => {
                  order.number = this.generate3DigitNumbers(order?.number);

                  return order;
                });

                ordersLo3So = orderOfBalo?.data;
                break;

              case BaoLoType.Lo4So:
                orderOfBalo?.data?.map((order: any) => {
                  order.number = this.generate4DigitNumbers(order?.number);

                  return order;
                });
                ordersLo4So = orderOfBalo?.data;
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.LoXien:
          for (const ordersOfLoXien of order?.data) {
            switch (ordersOfLoXien?.type) {
              case LoXienType.Xien2:
              case LoXienType.Xien3:
              case LoXienType.Xien4:
                for (const item of ordersOfLoXien?.data) {
                  item?.number?.map((order: any) => {
                    return this.generate2DigitNumbers(order);
                  });
                }

                if (ordersOfLoXien?.type === LoXienType.Xien2) {
                  ordersXien2 = ordersOfLoXien?.data;
                } else if (ordersOfLoXien?.type === LoXienType.Xien3) {
                  ordersXien3 = ordersOfLoXien?.data;
                } else if (ordersOfLoXien?.type === LoXienType.Xien4) {
                  ordersXien4 = ordersOfLoXien?.data;
                }

                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.LoTruot:
          for (const ordersOfLoTruot of order?.data) {
            switch (ordersOfLoTruot?.type) {
              case LoTruocType.TruotXien4:
              case LoTruocType.TruotXien8:
              case LoTruocType.TruotXien10:

                for (const item of ordersOfLoTruot?.data) {
                  item?.number?.map((order: any) => {

                    return this.generate2DigitNumbers(order);
                  });
                }

                if (ordersOfLoTruot?.type === LoTruocType.TruotXien4) {
                  ordersTruotXien4 = ordersOfLoTruot?.data;
                } else if (ordersOfLoTruot?.type === LoTruocType.TruotXien8) {
                  ordersTruotXien8 = ordersOfLoTruot?.data;
                } else if (ordersOfLoTruot?.type === LoTruocType.TruotXien10) {
                  ordersTruotXien10 = ordersOfLoTruot?.data;
                }
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.DanhDe:
          for (const ordersOfDanhDe of order?.data) {
            switch (ordersOfDanhDe?.type) {
              case DanhDeType.DeDau:
              case DanhDeType.DeDacBiet:
              case DanhDeType.DeDauDuoi:
                ordersOfDanhDe?.data?.map((order: any) => {
                  order.number = this.generate2DigitNumbers(order?.number);

                  return order;
                });

                if (ordersOfDanhDe.type === DanhDeType.DeDau) {
                  ordersDeDau = ordersOfDanhDe?.data;
                } else if (ordersOfDanhDe.type === DanhDeType.DeDacBiet) {
                  ordersDeDacBiet = ordersOfDanhDe?.data;
                } else if (ordersOfDanhDe.type === DanhDeType.DeDauDuoi) {
                  ordersDeDauDuoi = ordersOfDanhDe?.data;
                }
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.Lo3Cang:
          for (const ordersOf3Cang of order?.data) {
            switch (ordersOf3Cang?.type) {
              case BaCangType.BaCangDau:
              case BaCangType.BaCangDacBiet:
              case BaCangType.BaCangDauDuoi:
                ordersOf3Cang?.data?.map((order: any) => {
                  order.number = this.generate3DigitNumbers(order.number);

                  return order;
                });

                if (ordersOf3Cang?.type === BaCangType.BaCangDau) {
                  ordersBaCangDau = ordersOf3Cang?.data;
                } else if (ordersOf3Cang?.type === BaCangType.BaCangDacBiet) {
                  ordersBaCangDacBiet = ordersOf3Cang?.data;
                } else if (ordersOf3Cang?.type === BaCangType.BaCangDauDuoi) {
                  ordersBaCangDauDuoi = ordersOf3Cang?.data;
                }
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.Lo4Cang:
          for (const ordersOf4Cang of order?.data) {
            switch (ordersOf4Cang?.type) {
              case BonCangType.BonCangDacBiet:
                ordersOf4Cang?.data?.map((order: any) => {
                  order.number = this.generate4DigitNumbers(order.number);

                  return order;
                });

                ordersBonCangDacBiet = ordersOf4Cang?.data || [];
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.DauDuoi:
          for (const ordersOfDauDuoi of order?.data) {
            switch (ordersOfDauDuoi?.type) {
              case DauDuoiType.Dau:
                ordersDau = ordersOfDauDuoi?.data;
                break;

              case DauDuoiType.Duoi:
                ordersDuoi = ordersOfDauDuoi?.data;
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.TroChoiThuVi:
          for (const orders of order?.data) {
            switch (orders.type) {
              case TroChoiThuViType.Lo2SoGiaiDacBiet:
                ordersLo2SoGiaiDacBiet = orders?.data || [];
                break;

              default:
                break;
            }
          }
          break;

        default:
          break;
      }
    }

    return {
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
      ordersXien2,
      ordersXien3,
      ordersXien4,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      ordersDeDau,
      ordersDeDacBiet,
      ordersDeDauDuoi,
      ordersBaCangDacBiet,
      ordersBaCangDauDuoi,
      ordersBaCangDau,
      ordersBonCangDacBiet,
      ordersDau,
      ordersDuoi,
      ordersLo2SoGiaiDacBiet,
    };
  }

  getInfoToGeneratePrize({
    typePrize,
  }: any) {
    let numberOfNumbers = 0;
    let actualLength = 0;
    let expectedLength = 0;

    switch (typePrize) {
      case PRIZES.SPECIAL_PRIZE:
        numberOfNumbers = 1;
        actualLength = 6;

        break;
      case PRIZES.PRIZE_1:
        numberOfNumbers = 1;
        actualLength = 5;

        break;
      case PRIZES.PRIZE_2:
        numberOfNumbers = 1;
        actualLength = 5;

        break;
      case PRIZES.PRIZE_3:
        numberOfNumbers = 2;
        actualLength = 5;

        break;
      case PRIZES.PRIZE_4:
        numberOfNumbers = 7;
        actualLength = 5;

        break;
      case PRIZES.PRIZE_5:
        numberOfNumbers = 1;
        actualLength = 4;

        break;
      case PRIZES.PRIZE_6:
        numberOfNumbers = 3;
        actualLength = 4;

        break;
      case PRIZES.PRIZE_7:
        numberOfNumbers = 1;
        actualLength = 3;

        break;
      case PRIZES.PRIZE_8:
        numberOfNumbers = 1;
        actualLength = 2;

        break;
      default:
        break;
    }

    return {
      actualLength,
      expectedLength,
      numberOfNumbers,
    };
  }

  createPrizes({
    numbers,
    typePrize,
    exclusionNumbers,
  }: any) {

    let { numberOfNumbers, actualLength, expectedLength } = this.getInfoToGeneratePrize({
      typePrize,
    });

    const result = [];
    if (!numbers || numbers.length === 0) {
      for (let i = 0; i < numberOfNumbers; i++) {
        const tempNumber = this.randomNumber(actualLength, { excludeNumbers: exclusionNumbers });
        result.push(tempNumber);
      }
    } else {
      for (const number of numbers) {
        expectedLength = actualLength - number.toString().length;
        const tempNumber = this.randomNumber(expectedLength);
        result.push(`${tempNumber}${number}`);
      }

      while (true) {
        if (result.length >= numberOfNumbers) {
          break;
        }

        const tempNumber = this.randomNumber(actualLength, { excludeNumbers: exclusionNumbers });
        result.push(tempNumber);
      }
    }

    return result;
  }

  randomNumber(length: number, options?: any) {
    if (!length) return '';

    let numberLength;
    switch (length) {
      case 1:
        numberLength = 10;
        break;
      case 2:
        numberLength = 100;
        break;
      case 3:
        numberLength = 1000;
        break;
      case 4:
        numberLength = 10000;
        break;
      case 5:
        numberLength = 100000;
        break;
      case 6:
        numberLength = 1000000;
        break;

      default:
        break;
    }

    let newNumber;
    let condition = true;
    do {
      newNumber = (Math.floor(Math.random() * numberLength)).toString();
      if (!options?.excludeNumbers || options?.excludeNumbers?.length === 0) {
        condition = false;
      } else {

        for (const excludeNumber of options.excludeNumbers) {
          // let tempExcludeNumber = excludeNumber;
          // if (excludeNumber.length === 1) {
          //   tempExcludeNumber = `0${excludeNumber}`;
          // }


          if (newNumber.length >= 2) {
            const lastTwoDigits = newNumber.substr(-2);
            const lastTwoDigitsOfExcludeNumber = excludeNumber.substr(-2);
            condition = lastTwoDigits == lastTwoDigitsOfExcludeNumber;


            if (condition) break;
          }
        }
      }



    } while (condition)


    // while (true) {
    //   newNumber = (Math.floor(Math.random() * numberLength)).toString();
    //   if (!options?.excludeNumbers || options?.excludeNumbers?.length === 0) break;

    //   for (const excludeNumber of options.excludeNumbers) {
    //     let tempExcludeNumber = excludeNumber;
    //     if (excludeNumber.length === 1) {
    //       tempExcludeNumber = `0${excludeNumber}`;
    //     }

    //     if (newNumber.length >= 2) {
    //       const lastTwoDigits = newNumber.substr(-2);
    //       condition = lastTwoDigits == tempExcludeNumber;

    //       // console.log("tempExcludeNumber", tempExcludeNumber);
    //       // console.log("lastTwoDigits", lastTwoDigits);
    //       // console.log("condition", condition);
    //       if (condition) break;
    //     }
    //   }
    // }

    const tempLength = length - newNumber.length;
    for (let i = 0; i < tempLength; i++) {
      newNumber = '0' + newNumber;
    }

    return newNumber;
  }

  compareRandom(a: any, b: any) {
    return Math.random() - 0.5;
  }

  getTotalBetAmount(orders: any): number {
    if (!orders || orders.length === 0) return 0;

    let totalBetAmount = 0;
    for (const order of orders) {
      switch (order?.categoryLotteryType) {
        case CategoryLotteryType.BaoLo:
          for (const ordersOfBalo of order?.data) {
            const totalScore = this.getTotalScore(ordersOfBalo?.data);
            switch (ordersOfBalo.type) {
              case BaoLoType.Lo2So:
                totalBetAmount += (totalScore * PricePerScore.Lo2So);
                console.log("Total score 2so", totalScore);
                console.log("Tong tien users dat cuoc: 2so", (totalScore * PricePerScore.Lo2So));
                break;

              case BaoLoType.Lo2So1k:
                totalBetAmount += (totalScore * PricePerScore.Lo2So1k);
                console.log("Total score 2so 1k", totalScore);
                console.log("Tong tien users dat cuoc: 2so1k", (totalScore * PricePerScore.Lo2So1k));
                break;

              case BaoLoType.Lo3So:
                totalBetAmount += (totalScore * PricePerScore.Lo3So);
                console.log("Total score 3so", totalScore);
                console.log("Tong tien users dat cuoc: 3so", (totalScore * PricePerScore.Lo3So));
                break;

              case BaoLoType.Lo4So:
                totalBetAmount += (totalScore * PricePerScore.Lo4So);
                console.log("Total score 4so", totalScore);
                console.log("Tong tien users dat cuoc: 4so", (totalScore * PricePerScore.Lo4So));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.LoXien:
          for (const ordersOfLoXien of order?.data) {
            const totalScore = this.getTotalScore(ordersOfLoXien?.data);

            switch (ordersOfLoXien.type) {
              case LoXienType.Xien2:
                totalBetAmount += (totalScore * PricePerScore.Xien2);
                console.log("Total score xien 2", totalScore);
                console.log("Tong tien users dat cuoc: xien 2", (totalScore * PricePerScore.Xien2));
                break;

              case LoXienType.Xien3:
                totalBetAmount += (totalScore * PricePerScore.Xien3);
                console.log("Total score xien 3", totalScore);
                console.log("Tong tien users dat cuoc: xien 3", (totalScore * PricePerScore.Xien3));
                break;

              case LoXienType.Xien4:
                totalBetAmount += (totalScore * PricePerScore.Xien4);
                console.log("Total score xien 4", totalScore);
                console.log("Tong tien users dat cuoc: xien 4", (totalScore * PricePerScore.Xien4));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.DanhDe:
          for (const ordersOfDanhDe of order?.data) {
            const totalScore = this.getTotalScore(ordersOfDanhDe?.data);

            switch (ordersOfDanhDe?.type) {
              case DanhDeType.DeDau:
                totalBetAmount += (totalScore * PricePerScore.DeDau);
                console.log("Total score de dau", totalScore);
                console.log("Tong tien users dat cuoc: de dau", (totalScore * PricePerScore.DeDau));
                break;

              case DanhDeType.DeDacBiet:
                totalBetAmount += (totalScore * PricePerScore.DeDacBiet);
                console.log("Total score de dac biet", totalScore);
                console.log("Tong tien users dat cuoc: de dac biet", (totalScore * PricePerScore.DeDacBiet));
                break;

              case DanhDeType.DeDauDuoi:
                totalBetAmount += (totalScore * PricePerScore.DeDauDuoi);
                console.log("Total score de dau duoi", totalScore);
                console.log("Tong tien users dat cuoc: de dau duoi", (totalScore * PricePerScore.DeDauDuoi));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.DauDuoi:
          for (const ordersOfDauDuoi of order?.data) {
            const totalScore = this.getTotalScore(ordersOfDauDuoi?.data);

            switch (ordersOfDauDuoi?.type) {
              case DauDuoiType.Duoi:
                totalBetAmount += (totalScore * PricePerScore.Duoi);
                console.log("Total score duoi", totalScore);
                console.log("Tong tien users dat cuoc: duoi", (totalScore * PricePerScore.Duoi));
                break;

              case DauDuoiType.Dau:
                totalBetAmount += (totalScore * PricePerScore.Dau);
                console.log("Total score dau", totalScore);
                console.log("Tong tien users dat cuoc: dau", (totalScore * PricePerScore.Dau));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.Lo3Cang:
          for (const ordersOf3Cang of order?.data) {
            const totalScore = this.getTotalScore(ordersOf3Cang?.data);

            switch (ordersOf3Cang?.type) {
              case BaCangType.BaCangDacBiet:
                totalBetAmount += (totalScore * PricePerScore.BaCangDacBiet);
                console.log("Total score 3 cang dat biet", totalScore);
                console.log("Tong tien users dat cuoc: 3 cang dac biet", (totalScore * PricePerScore.BaCangDacBiet));
                break;

              case BaCangType.BaCangDauDuoi:
                totalBetAmount += (totalScore * PricePerScore.BaCangDauDuoi);
                console.log("Total score 3 cang dau duoi", totalScore);
                console.log("Tong tien users dat cuoc: 3 cang dau duoi", (totalScore * PricePerScore.BaCangDauDuoi));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.Lo4Cang:
          for (const ordersOf4Cang of order?.data) {
            const totalScore = this.getTotalScore(ordersOf4Cang?.data);

            switch (ordersOf4Cang?.type) {
              case BaCangType.BaCangDauDuoi:
                totalBetAmount += (totalScore * PricePerScore.BaCangDauDuoi);
                console.log("Total score 4 cang dat biet", totalScore);
                console.log("Tong tien users dat cuoc: 4 cang dac biet", (totalScore * PricePerScore.BaCangDauDuoi));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.LoTruot:
          for (const ordersOfLoTruot of order?.data) {
            const totalScore = this.getTotalScore(ordersOfLoTruot?.data);

            switch (ordersOfLoTruot.type) {
              case LoTruocType.TruotXien4:
                totalBetAmount += (totalScore * PricePerScore.XienTruot4);
                console.log("Total score truot xien 4", totalScore);
                console.log("Tong tien users dat cuoc: truot 4", (totalScore * PricePerScore.XienTruot4));
                break;

              case LoTruocType.TruotXien8:
                totalBetAmount += (totalScore * PricePerScore.XienTruot8);
                console.log("Total score truot xien 8", totalScore);
                console.log("Tong tien users dat cuoc: truot 8", (totalScore * PricePerScore.XienTruot8));
                break;

              case LoTruocType.TruotXien10:
                totalBetAmount += (totalScore * PricePerScore.XienTruot10);
                console.log("Total score truot xien 10", totalScore);
                console.log("Tong tien users dat cuoc: truot 10", (totalScore * PricePerScore.XienTruot10));
                break;

              default:
                break;
            }
          }
          break;

        case CategoryLotteryType.TroChoiThuVi:
          for (const ordersOfTroChoiThuVi of order?.data) {
            switch (ordersOfTroChoiThuVi?.type) {
              case TroChoiThuViType.Lo2SoGiaiDacBiet:
                for (const order of ordersOfTroChoiThuVi?.data) {
                  switch (order.number) {
                    case Lo2SoGiaiDacBietType.Tai:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tai * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Xiu:
                      totalBetAmount += (order?.score || 0) * (OddBet.Xiu * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Chan:
                      totalBetAmount += (order?.score || 0) * (OddBet.Chan * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Le:
                      totalBetAmount += (order?.score || 0) * (OddBet.Le * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong0:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong0 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong1:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong1 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong2:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong2 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong3:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong3 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong4:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong4 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong5:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong5 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong6:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong6 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong7:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong7 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong8:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong8 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong9:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong9 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong10:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong10 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong11:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong11 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong12:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong12 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong13:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong13 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong14:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong14 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong15:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong15 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong16:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong16 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong17:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong17 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.Tong18:
                      totalBetAmount += (order?.score || 0) * (OddBet.Tong18 * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.TongTai:
                      totalBetAmount += (order?.score || 0) * (OddBet.TongTai * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.TongXiu:
                      totalBetAmount += (order?.score || 0) * (OddBet.TongXiu * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.TongChan:
                      totalBetAmount += (order?.score || 0) * (OddBet.TongChan * 1000);
                      break;

                    case Lo2SoGiaiDacBietType.TongLe:
                      totalBetAmount += (order?.score || 0) * (OddBet.TongLe * 1000);
                      break;

                    default:
                      break;
                  }
                }
                break;

              default:
                break;
            }
          }
          break;

        default:
          break;
      }
    }

    return totalBetAmount;
  }

  getTotalScore(orders: OrderDto[]): number {
    if (!orders || orders.length === 0) return 0;

    return orders.reduce((accumulator: number, currentValue: OrderDto) => {

      return accumulator + currentValue.score;
    }, 0);
  }

  getOrdersNumber(orders: OrderDto[]): string[] {
    if (!orders || orders.length === 0) return [];

    return orders.reduce((accumulator: string[], currentValue: OrderDto) => {
      accumulator.push(currentValue.number.toString());
      return accumulator;
    }, []);
  }
}
