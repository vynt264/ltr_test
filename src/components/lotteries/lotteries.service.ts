import { Injectable } from '@nestjs/common';
import * as _ from "lodash";
import { CreateLotteryDto } from './dto/create-lottery.dto';
import { UpdateLotteryDto } from './dto/update-lottery.dto';
import {
  INIT_TIME_CREATE_JOB,
  MAINTENANCE_PERIOD,
  PRIZES,
  START_TIME_CREATE_JOB,
} from '../../system/constants';
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
} from '../../system/enums/lotteries';
import { ManageBonusPriceService } from '../manage-bonus-price/manage-bonus-price.service';
import { addHours, startOfDay } from 'date-fns';
import { OrderHelper } from 'src/common/helper';
import { PROFIT_PERCENTAGE } from 'src/system/config.system/config.default';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class LotteriesService {
  constructor(
    private readonly manageBonusPriceService: ManageBonusPriceService,
    private readonly settingsService: SettingsService,
  ) { }

  async generatePrizes(orders: any, bonusPrice?: number) {
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

    let totalBetAmount = this.getTotalBetAmount(orders);
    let temptotalBetAmount = totalBetAmount;
    if (bonusPrice > 0) {
      temptotalBetAmount = totalBetAmount + bonusPrice;
    }

    let profit = await this.settingsService.getProfit();
    if (!profit && profit !== 0) {
      profit = Number(PROFIT_PERCENTAGE);
    }

    const finalResult = this.getPrizes({
      profit: Number(profit),
      ordersLo2So,
      ordersLo2So1k,
      ordersLo3So,
      ordersLo4So,
      totalBetAmount: temptotalBetAmount,
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

    // let totalPayout = 0;
    // for (const item of finalResult) {
    //   totalPayout += item.payOut;
    // }

    return {
      // numbers,
      // percentProfit,
      // prizes,
      // whiteList,
      // mergeNumbers,
      // prizesFinal,
      // totalAmount
      totalBetAmount,
      finalResult,
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

  async handlerPrizes({
    isTestPlayer,
    type,
    data,
    // bookmakerId,
  }: any) {
    const timeStartDay = startOfDay(new Date());
    const fromDate = addHours(timeStartDay, START_TIME_CREATE_JOB).getTime();
    const toDate = fromDate + ((24 * 60 * 60) - (MAINTENANCE_PERIOD * 60)) * 1000;
    const dataBonusPrice = await this.manageBonusPriceService.findBonusPriceByType({
      type,
      toDate,
      fromDate,
      isTestPlayer,
      // bookmakerId,
    });

    if (!dataBonusPrice) {
      // TODO: !dataBonusPrice
    }
    let profit = await this.settingsService.getProfit();
    if (!profit && profit !== 0) {
      profit = Number(PROFIT_PERCENTAGE);
    }

    const prizes = await this.generatePrizes(data, dataBonusPrice.bonusPrice);
    const bonusPriceCurrent = dataBonusPrice.bonusPrice;
    const totalBet = (dataBonusPrice?.totalBet || 0) + (prizes.totalBetAmount || 0);
    const totalProfit = (dataBonusPrice?.totalProfit || 0) + ((prizes?.totalBetAmount || 0) - (prizes?.finalResult?.totalPayout || 0));
    const bonusPrice = totalProfit - (totalBet * ((profit / 100)));

    dataBonusPrice.totalBet = totalBet;
    dataBonusPrice.totalProfit = totalProfit;
    dataBonusPrice.bonusPrice = bonusPrice;

    await this.manageBonusPriceService.update(dataBonusPrice.id, dataBonusPrice);
    const totalRevenue = _.get(prizes, 'totalBetAmount', 0);
    const totalPayout = _.get(prizes, 'finalResult.totalPayout', 0);

    return {
      prizes,
      totalRevenue,
      totalPayout,
      bonusPrice: bonusPriceCurrent,
      totalProfit: totalRevenue - totalPayout,
    };
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

  generatePrizesSpecial({
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

    // Chuyển đối tượng thành Map
    const prizeMap = new Map(Object.entries(arrayOf9999Numbers));

    // Sắp xếp Map theo giá trị
    const sortedPrizeMap = new Map([...prizeMap.entries()].sort((a: any, b: any) => a[1] - b[1]));

    // Chuyển Map về đối tượng
    // const sortedPrize = Object.fromEntries(sortedPrizeMap);

    return sortedPrizeMap;
  }

  generatePrizes8({
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

    // Chuyển đối tượng thành Map
    const prizeMap = new Map(Object.entries(arrayOf99Numbers));

    // Sắp xếp Map theo giá trị
    const sortedPrizeMap = new Map([...prizeMap.entries()].sort((a: any, b: any) => a[1] - b[1]));

    // Chuyển Map về đối tượng
    // const sortedPrize = Object.fromEntries(sortedPrizeMap);

    return sortedPrizeMap;
  }

  generatePrizes7({
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

    // Chuyển đối tượng thành Map
    const prizeMap = new Map(Object.entries(arrayOf999Numbers));

    // Sắp xếp Map theo giá trị
    const sortedPrizeMap = new Map([...prizeMap.entries()].sort((a: any, b: any) => a[1] - b[1]));

    // Chuyển Map về đối tượng
    // const sortedPrize = Object.fromEntries(sortedPrizeMap);

    return sortedPrizeMap;
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

    // Chuyển đối tượng thành Map
    const prizeMap = new Map(Object.entries(arrayOf9999Numbers));

    // Sắp xếp Map theo giá trị
    const sortedPrizeMap = new Map([...prizeMap.entries()].sort((a: any, b: any) => a[1] - b[1]));

    // Chuyển Map về đối tượng
    // const sortedPrize = Object.fromEntries(sortedPrizeMap);

    return sortedPrizeMap;
  }

  processingXien2({ ordersXien2, prizesFinal, prizes, type, xien2Checked }: any) {
    const temFinal: any = [];
    for (const item of prizesFinal) {
      const lastTwoDigits = item.number.slice(-2);
      temFinal.push(lastTwoDigits);
    }
    ordersXien2.forEach((orderXien2: any, index: any) => {
      const numberNotExistInXien2 = orderXien2.number.filter((item: any) => temFinal.indexOf(item) === -1);

      if (numberNotExistInXien2.length === 1) {
        let key = numberNotExistInXien2[0];
        if (type === 'giai-8') {
          key = `${key}`;
        }

        if (type === 'giai-7') {
          key = `0${key}`;
        }

        if (type === 'remain') {
          key = `00${key}`;
        }

        const existed = xien2Checked.some((item: any) => (item.indexOfXien === index && item.number === key));

        if (!existed) {
          let payOut = prizes.get(key);
          payOut += ((orderXien2.score || 0) * (OddBet.Xien2 * 1000));
          prizes.set(key, payOut);

          xien2Checked.push({
            indexOfXien: index,
            number: key,
          });
        }
      }
    });
  }

  processingXien3({ ordersXien3, prizesFinal, prizes, type, xien3Checked }: any) {
    const temFinal: any = [];
    for (const item of prizesFinal) {
      const lastTwoDigits = item.number.slice(-2);
      temFinal.push(lastTwoDigits);
    }
    ordersXien3.forEach((orderXien3: any, index: any) => {
      const numberNotExistInXien2 = orderXien3.number.filter((item: any) => temFinal.indexOf(item) === -1);

      if (numberNotExistInXien2.length === 1) {
        let key = numberNotExistInXien2[0];
        if (type === 'giai-8') {
          key = `${key}`;
        }

        if (type === 'giai-7') {
          key = `0${key}`
        }

        if (type === 'remain') {
          key = `00${key}`
        }

        const existed = xien3Checked.some((item: any) => (item.indexOfXien === index && item.number === key));

        if (!existed) {
          let payOut = prizes.get(key);
          payOut += ((orderXien3.score || 0) * (OddBet.Xien3 * 1000));
          prizes.set(key, payOut);
          xien3Checked.push({
            indexOfXien: index,
            number: key,
          });
        }
      }
    });
  }

  processingXien4({ ordersXien4, prizesFinal, prizes, type, xien4Checked }: any) {
    const temFinal: any = [];
    for (const item of prizesFinal) {
      const lastTwoDigits = item.number.slice(-2);
      temFinal.push(lastTwoDigits);
    }
    ordersXien4.forEach((orderXien4: any, index: any) => {
      const numberNotExistInXien2 = orderXien4.number.filter((item: any) => temFinal.indexOf(item) === -1);

      if (numberNotExistInXien2.length === 1) {
        let key = numberNotExistInXien2[0];
        if (type === 'giai-8') {
          key = `${key}`;
        }

        if (type === 'giai-7') {
          key = `0${key}`;
        }

        if (type === 'remain') {
          key = `00${key}`;
        }

        const existed = xien4Checked.some((item: any) => (item.indexOfXien === index && item.number === key));

        if (!existed) {
          let payOut = prizes.get(key);
          payOut += ((orderXien4.score || 0) * (OddBet.Xien4 * 1000));
          prizes.set(key, payOut);
          xien4Checked.push({
            indexOfXien: index,
            number: key,
          });
        }
      }
    });
  }

  checkXien({
    ordersXien2,
    ordersXien3,
    ordersXien4,
    prizesFinal,
    mergeResult,
    xien2Checked,
    xien3Checked,
    xien4Checked,
    type,
  }: any) {
    this.processingXien2({ ordersXien2, prizesFinal, prizes: mergeResult, type, xien2Checked });
    this.processingXien3({ ordersXien3, prizesFinal, prizes: mergeResult, type, xien3Checked });
    this.processingXien4({ ordersXien4, prizesFinal, prizes: mergeResult, type, xien4Checked });
  }

  checkXienTemp({
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
    ordersXien2HasCounted,
    ordersXien3HasCounted,
    ordersXien4HasCounted,
    type,
  }: any) {
    let indexOrdersTruotXien4HasCounted: any = [];
    if (totalBetAmount < 0) {
      // for (const orders of ordersTruotXien4) {
      ordersTruotXien4.forEach((orders: any, index: number) => {
        const firstItem = orders.number[0];
        const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));

        const exist = indexOrdersTruotXien4HasCounted.find((i: any) => i == index);
        let key;

        if (type === 'giai-8') {
          key = `${firstItem}`;
        }

        if (type === 'giai-7') {
          const randomNumber = Math.round(Math.random() * 9);
          key = randomNumber.toString();
          key = `${key}${firstItem}`;
        }

        if (
          type === "giai-dac-biet"
          || type === "giai-khac"
        ) {
          const randomNumber = Math.round(Math.random() * 99);
          key = randomNumber.toString();
          if (randomNumber.toString().length === 1) {
            key = `0${key}`;
          }

          key = `${key}${firstItem}`;
        }

        if (!exist) {
          if (prizes.has(key) && !hasInFinalResult) {
            let payOut = prizes.get(key);
            payOut -= ((orders.score || 0) * (OddBet.TruotXien4 * 1000));
            prizes.set(key, payOut);
            indexOrdersTruotXien4HasCounted.push(index);
          }
        }
      });
    }

    ordersTruotXien4 = ordersTruotXien4.reduce((result: any, currentValue: any, currentIndex: number) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        const hasIndex = ordersXien2HasCounted.some((index: any) => index == currentIndex);
        if (!hasIndex) {
          totalBetAmount += (OddBet.TruotXien4 * 1000 * (currentValue?.score || 0));
          ordersXien2HasCounted.push(currentIndex);
        }
      }
      // else {
      //   result.push(currentValue);
      // }

      result.push(currentValue);

      return result;
    }, []);


    let indexOrdersTruotXien8HasCounted: any = [];
    if (totalBetAmount < 0) {
      ordersTruotXien8.forEach((orders: any, index: number) => {
        const firstItem = orders.number[0];
        const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));

        const exist = indexOrdersTruotXien8HasCounted.find((i: any) => i == index);
        let key;

        if (type === 'giai-8') {
          key = `${firstItem}`;
        }

        if (type === 'giai-7') {
          const randomNumber = Math.round(Math.random() * 9);
          key = randomNumber.toString();
          key = `${key}${firstItem}`;
        }

        if (
          type === "giai-dac-biet"
          || type === "giai-khac"
        ) {
          const randomNumber = Math.round(Math.random() * 99);
          key = randomNumber.toString();
          if (randomNumber.toString().length === 1) {
            key = `0${key}`;
          }

          key = `${key}${firstItem}`;
        }

        if (!exist) {
          if (prizes.has(key) && !hasInFinalResult) {
            let payOut = prizes.get(key);
            payOut -= ((orders.score || 0) * (OddBet.TruotXien8 * 1000));
            prizes.set(key, payOut);
            indexOrdersTruotXien8HasCounted.push(index);
          }
        }
      })
    }

    //
    ordersTruotXien8 = ordersTruotXien8.reduce((result: any, currentValue: any, currentIndex: number) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        const hasIndex = ordersXien3HasCounted.some((index: any) => index == currentIndex);
        if (!hasIndex) {
          totalBetAmount += (OddBet.TruotXien8 * 1000 * (currentValue?.score || 0));
          ordersXien3HasCounted.push(currentIndex);
        }
      }

      result.push(currentValue);

      return result;
    }, []);


    let indexOrdersTruotXien10HasCounted: any = [];
    if (totalBetAmount < 0) {
      ordersTruotXien10.forEach((orders: any, index: number) => {
        const firstItem = orders.number[0];
        const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));

        const exist = indexOrdersTruotXien10HasCounted.find((i: any) => i == index);
        let key;

        if (type === 'giai-8') {
          key = `${firstItem}`;
        }

        if (type === 'giai-7') {
          const randomNumber = Math.round(Math.random() * 9);
          key = randomNumber.toString();
          key = `${key}${firstItem}`;
        }

        if (
          type === "giai-dac-biet"
          || type === "giai-khac"
        ) {
          const randomNumber = Math.round(Math.random() * 99);
          key = randomNumber.toString();
          if (randomNumber.toString().length === 1) {
            key = `0${key}`;
          }

          key = `${key}${firstItem}`;
        }

        if (!exist) {
          if (prizes.has(key) && !hasInFinalResult) {
            let payOut = prizes.get(key);
            payOut -= ((orders.score || 0) * (OddBet.TruotXien10 * 1000));
            prizes.set(key, payOut);
            indexOrdersTruotXien10HasCounted.push(index);
          }
        }
      })
    }

    //
    ordersTruotXien10 = ordersTruotXien10.reduce((result: any, currentValue: any, currentIndex: number) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        const hasIndex = ordersXien4HasCounted.some((index: any) => index == currentIndex);
        if (!hasIndex) {
          totalBetAmount += (OddBet.TruotXien10 * 1000 * (currentValue?.score || 0));
          ordersXien4HasCounted.push(currentIndex);
        }
      }
      result.push(currentValue);

      return result;
    }, []);

    let result: any = [];
    prizes.forEach((value: any, key: any) => {
      result.push({
        number: key,
        payOut: value
      });
    });

    // prizes.sort((a: any, b: any) => a.payOut - b.payOut);

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: result,
    };
  }

  checkLoTruot2({
    totalBetAmount,
    finalResult,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    prizes,
    ordersXien2HasCounted,
    ordersXien3HasCounted,
    ordersXien4HasCounted,
  }: any) {
    if (totalBetAmount < 0) {
      for (const orders of ordersTruotXien4) {
        const firstItem = orders.number[0];
        const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));

        for (let i = 0; i <= 99; i++) {
          let key = i.toString();
          if (i.toString().length === 1) {
            key = `0${i}`;
          }
          key = `${key}${firstItem}`;

          //
          // 0000

          if (prizes.has(key) && !hasInFinalResult) {
            let payOut = prizes.get(key);
            payOut -= ((orders.score || 0) * (OddBet.TruotXien4 * 1000));
            prizes.set(key, payOut);
          } else {
            let payOut = prizes.get(key);
            payOut += ((orders.score || 0) * (OddBet.TruotXien4 * 1000));
            prizes.set(key, payOut);
          }
        }
      }
    }

    ordersTruotXien4 = ordersTruotXien4.reduce((result: any, currentValue: any, currentIndex: number) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        const hasIndex = ordersXien2HasCounted.some((index: any) => index == currentIndex);
        if (!hasIndex) {
          totalBetAmount += (OddBet.TruotXien4 * 1000 * (currentValue?.score || 0));
          ordersXien2HasCounted.push(currentIndex);
        }
      }
      // else {
      //   result.push(currentValue);
      // }

      result.push(currentValue);

      return result;
    }, []);



    //
    ordersTruotXien8 = ordersTruotXien8.reduce((result: any, currentValue: any, currentIndex: number) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        const hasIndex = ordersXien3HasCounted.some((index: any) => index == currentIndex);
        if (!hasIndex) {
          totalBetAmount += (OddBet.TruotXien8 * 1000 * (currentValue?.score || 0));
          ordersXien3HasCounted.push(currentIndex);
        }
      }

      result.push(currentValue);

      return result;
    }, []);

    for (const orders of ordersTruotXien8) {
      const firstItem = orders.number[0];
      const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));

      for (let i = 0; i <= 99; i++) {
        let key = i.toString();
        if (i.toString().length === 1) {
          key = `0${i}`;
        }
        key = `${key}${firstItem}`;

        if (prizes.has(key) && !hasInFinalResult) {
          let payOut = prizes.get(key);
          payOut -= ((orders.score || 0) * (OddBet.TruotXien8 * 1000));
          prizes.set(key, payOut);
        } else {
          let payOut = prizes.get(key);
          payOut += ((orders.score || 0) * (OddBet.TruotXien8 * 1000));
          prizes.set(key, payOut);
        }
      }
    }

    //
    ordersTruotXien10 = ordersTruotXien10.reduce((result: any, currentValue: any, currentIndex: number) => {
      let exist;
      for (const res of finalResult) {
        exist = currentValue?.number.some((n: any) => res?.number.endsWith(n));
        if (exist) {
          break;
        }
      }

      if (exist) {
        const hasIndex = ordersXien4HasCounted.some((index: any) => index == currentIndex);
        if (!hasIndex) {
          totalBetAmount += (OddBet.TruotXien10 * 1000 * (currentValue?.score || 0));
          ordersXien4HasCounted.push(currentIndex);
        }
      }

      result.push(currentValue);

      return result;
    }, []);

    for (const orders of ordersTruotXien10) {
      const firstItem = orders.number[0];
      const hasInFinalResult = finalResult.some((n: any) => n.number.endsWith(firstItem));

      for (let i = 0; i <= 99; i++) {
        let key = i.toString();
        if (i.toString().length === 1) {
          key = `0${i}`;
        }
        key = `${key}${firstItem}`;

        if (prizes.has(key) && !hasInFinalResult) {
          let payOut = prizes.get(key);
          payOut -= ((orders.score || 0) * (OddBet.TruotXien10 * 1000));
          prizes.set(key, payOut);
        } else {
          let payOut = prizes.get(key);
          payOut += ((orders.score || 0) * (OddBet.TruotXien10 * 1000));
          prizes.set(key, payOut);
        }
      }
    }

    let result: any = [];
    prizes.forEach((value: any, key: any) => {
      result.push({
        number: key,
        payOut: value
      });
    });

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: result,
    };
  }

  getPrize7Temp({
    profit,
    totalBetAmount,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    prizesSpecialAnd8,
    prizes7,
    ordersXien2,
    ordersXien3,
    ordersXien4,
    ordersXien2HasCounted,
    ordersXien3HasCounted,
    ordersXien4HasCounted,
  }: any) {
    let resultLoTruotOfPrize7: any = [];
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: resultLoTruotOfPrize7,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: prizesSpecialAnd8,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizes7,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
      type: 'giai-7',
    }));

    let amountPaid = 0;
    for (const val of prizesSpecialAnd8) {
      amountPaid += val.payOut;
    }

    let map1: Map<string, number> = new Map();
    let map2: Map<string, number> = new Map();

    prizes7.forEach((value: number, key: string) => {
      if (!value) {
        map2.set(key, value);
      } else {
        if ((value + amountPaid) < OrderHelper.getPayOut(totalBetAmount, profit)) {
          map1.set(key, value);
        }
      }
    });

    let mergedMap: Map<string, number> = new Map([...Array.from(map1.entries()), ...Array.from(map2.entries())]);

    const xien2Checked: any = [];
    const xien3Checked: any = [];
    const xien4Checked: any = [];
    this.checkXien({
      ordersXien2,
      ordersXien3,
      ordersXien4,
      prizesFinal: prizesSpecialAnd8,
      mergeResult: mergedMap,
      type: 'giai-8',
      xien2Checked,
      xien3Checked,
      xien4Checked
    });

    const [firstKey] = mergedMap.keys();
    const [firstValue] = mergedMap.values();

    let prizesSpecialAnd8And7 = [...prizesSpecialAnd8, ...[{ number: firstKey, payOut: firstValue }]];

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizesSpecialAnd8And7,
    };
  }

  // getPrize7({
  //   totalBetAmount,
  //   ordersTruotXien4,
  //   ordersTruotXien8,
  //   ordersTruotXien10,
  //   prizesSpecialAnd8,
  //   prizes7,
  //   ordersXien2,
  //   ordersXien3,
  //   ordersXien4,
  //   ordersXien2HasCounted,
  //   ordersXien3HasCounted,
  //   ordersXien4HasCounted,
  // }: any) {
  //   let resultLoTruotOfPrize7: any = [];
  //   ({
  //     totalBetAmount,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizes: resultLoTruotOfPrize7,
  //   } = this.checkLoTruot2({
  //     totalBetAmount,
  //     finalResult: prizesSpecialAnd8,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizes: prizes7,
  //     ordersXien2HasCounted,
  //     ordersXien3HasCounted,
  //     ordersXien4HasCounted,
  //     type: 'giai-7',
  //   }));

  //   // transform data
  //   const tempResultLoTruotOfPrize7 = resultLoTruotOfPrize7.reduce((init: any, currentValue: any) => {
  //     if (!currentValue.payOut || currentValue.payOut === 0) {
  //       init.resultHavePayout0.push(currentValue);
  //     } else {
  //       init.resultNotHavePayout0.push(currentValue);
  //     }

  //     return init;
  //   }, { resultHavePayout0: [], resultNotHavePayout0: [] });
  //   resultLoTruotOfPrize7 = [...tempResultLoTruotOfPrize7.resultNotHavePayout0, ...tempResultLoTruotOfPrize7.resultHavePayout0];
  //   resultLoTruotOfPrize7 = [...prizesSpecialAnd8, ...resultLoTruotOfPrize7];

  //   let count1 = 0;
  //   const prizesSpecialAnd8And7 = [];
  //   let totalPayout = 0;
  //   for (const order of resultLoTruotOfPrize7) {
  //     if (count1 === 3) break;

  //     // if ((totalPayout + order?.payOut) >= ((totalBetAmount * 95) / 100)) {
  //     if ((totalPayout + order?.payOut) >= (OrderHelper.getPayOut(totalBetAmount))) {
  //       continue;
  //     }

  //     let lastTwoDigits = order?.number.slice(-2);
  //     prizesSpecialAnd8And7.push(order);
  //     count1++;
  //     totalPayout += order?.payOut;

  //     this.checkXienTemp({
  //       ordersXien2,
  //       ordersXien3,
  //       ordersXien4,
  //       prizesFinal: prizesSpecialAnd8And7,
  //       mergeResult: resultLoTruotOfPrize7,
  //       number: lastTwoDigits,
  //     });
  //   }

  //   return {
  //     totalBetAmount,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizesSpecialAnd8And7,
  //   };
  // }

  getPrizeRemainsTemp({
    profit,
    totalBetAmount,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    prizesSpecialAnd8And7,
    remainPrizes,
    ordersXien2,
    ordersXien3,
    ordersXien4,
    ordersXien2HasCounted,
    ordersXien3HasCounted,
    ordersXien4HasCounted,
  }: any) {
    const finalRemains: any = [];
    const xien2Checked: any = [];
    const xien3Checked: any = [];
    const xien4Checked: any = [];

    let limit = 15;
    for (let i = 0; i < limit; i++) {
      this.checkLoTruot({
        totalBetAmount,
        finalResult: prizesSpecialAnd8And7,
        ordersTruotXien4,
        ordersTruotXien8,
        ordersTruotXien10,
        prizes: remainPrizes,
        ordersXien2HasCounted,
        ordersXien3HasCounted,
        ordersXien4HasCounted,
      });

      this.checkXien({
        ordersXien2,
        ordersXien3,
        ordersXien4,
        prizesFinal: prizesSpecialAnd8And7,
        mergeResult: remainPrizes,
        type: 'remain',
        xien2Checked,
        xien3Checked,
        xien4Checked,
      });

      let mapArray = Array.from(remainPrizes);
      const tempPrizes: any = mapArray.sort((a: any, b: any) => a[1] - b[1]);

      prizesSpecialAnd8And7.push({
        number: tempPrizes[i][0],
        payOut: tempPrizes[i][1],
      });
      finalRemains.push({
        number: tempPrizes[i][0],
        payOut: tempPrizes[i][1],
      });
    }

    let totalPayout = 0;
    for (const prize of prizesSpecialAnd8And7) {
      totalPayout += prize.payOut;
    }

    for (const item of finalRemains) {
      this.checkLoTruot({
        totalBetAmount,
        finalResult: prizesSpecialAnd8And7,
        ordersTruotXien4,
        ordersTruotXien8,
        ordersTruotXien10,
        prizes: remainPrizes,
        ordersXien2HasCounted,
        ordersXien3HasCounted,
        ordersXien4HasCounted,
      });

      this.checkXien({
        ordersXien2,
        ordersXien3,
        ordersXien4,
        prizesFinal: prizesSpecialAnd8And7,
        mergeResult: remainPrizes,
        type: 'remain',
        xien2Checked,
        xien3Checked,
        xien4Checked,
      });

      const mang0: any = [];
      const mangKhac0: any = [];
      const prizes: any = [];

      remainPrizes.forEach((value: number, key: string) => {
        // if ((totalPayout - (item.payOut || 0) + value) < ((totalBetAmount * 95) / 100)) {
        if ((totalPayout - (item.payOut || 0) + value) < (OrderHelper.getPayOut(totalBetAmount, profit))) {
          prizes.push({
            number: key,
            payOut: value,
          });
        }
      });

      let index = (Math.floor(Math.random() * prizes.length)).toString();
      let order = prizes[index];

      if (order) {
        prizesSpecialAnd8And7 = prizesSpecialAnd8And7.filter((prize: any) => {
          return prize.number !== item.number;
        });

        totalPayout = (totalPayout - item.payOut + order.payOut);

        prizesSpecialAnd8And7 = [...prizesSpecialAnd8And7, ...[order]];
      }
    }

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      allPrizes: prizesSpecialAnd8And7,
    };
  }

  // getPrizeRemains({
  //   totalBetAmount,
  //   ordersTruotXien4,
  //   ordersTruotXien8,
  //   ordersTruotXien10,
  //   prizesSpecialAnd8And7,
  //   remainPrizes,
  //   ordersXien2,
  //   ordersXien3,
  //   ordersXien4,
  //   ordersXien2HasCounted,
  //   ordersXien3HasCounted,
  //   ordersXien4HasCounted,
  // }: any) {
  //   let resultLoTruotOfRemainSpecial;
  //   ({
  //     totalBetAmount,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizes: resultLoTruotOfRemainSpecial,
  //   } = this.checkLoTruot2({
  //     totalBetAmount,
  //     finalResult: prizesSpecialAnd8And7,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizes: remainPrizes,
  //     ordersXien2HasCounted,
  //     ordersXien3HasCounted,
  //     ordersXien4HasCounted,
  //   }));

  //   // transform data
  //   const tempResultLoTruotOfRemainSpecial = resultLoTruotOfRemainSpecial.reduce((init: any, currentValue: any) => {
  //     if (!currentValue.payOut || currentValue.payOut === 0) {
  //       init.resultHavePayout0.push(currentValue);
  //     } else {
  //       init.resultNotHavePayout0.push(currentValue);
  //     }

  //     return init;
  //   }, { resultHavePayout0: [], resultNotHavePayout0: [] });
  //   resultLoTruotOfRemainSpecial = [...tempResultLoTruotOfRemainSpecial.resultNotHavePayout0, ...tempResultLoTruotOfRemainSpecial.resultHavePayout0];
  //   resultLoTruotOfRemainSpecial = [...prizesSpecialAnd8And7, ...resultLoTruotOfRemainSpecial];
  //   let count2 = 0;
  //   const allPrizes = [];

  //   let totalPayout = 0;
  //   //resultLoTruotOfRemainSpecial danh sach 10000
  //   for (const order of resultLoTruotOfRemainSpecial) {

  //     if (count2 === 18) break;

  //     // if ((totalPayout + order?.payOut) >= ((totalBetAmount * 95) / 100)) {
  //     if ((totalPayout + order?.payOut) >= OrderHelper.getPayOut(totalBetAmount)) {
  //       continue;
  //     }

  //     let lastTwoDigits = order?.number.slice(-2);
  //     allPrizes.push(order);
  //     count2++;
  //     totalPayout += order?.payOut;

  //     this.checkXienTemp({
  //       ordersXien2,
  //       ordersXien3,
  //       ordersXien4,
  //       prizesFinal: allPrizes,
  //       mergeResult: resultLoTruotOfRemainSpecial,
  //       number: lastTwoDigits,
  //     });
  //   }

  //   return {
  //     totalBetAmount,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     allPrizes,
  //   };
  // }

  getPrize8Temp({
    profit,
    totalBetAmount,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    prizes8,
    finalPrizeSpecial,
    ordersXien2,
    ordersXien3,
    ordersXien4,
    ordersXien2HasCounted,
    ordersXien3HasCounted,
    ordersXien4HasCounted,
  }: any) {

    let resultLoTruotOfPrize8;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: resultLoTruotOfPrize8,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: finalPrizeSpecial,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizes8,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
      type: 'giai-8',
    }));

    let map1: Map<string, number> = new Map();
    let map2: Map<string, number> = new Map();

    let amountPaid = 0;
    for (const val of finalPrizeSpecial) {
      amountPaid += val.payOut;
    }

    prizes8.forEach((value: number, key: string) => {
      if (!value) {
        map2.set(key, value);
      } else {
        // if ((value + amountPaid) < (totalBetAmount * 95) / 100) {
        if ((value + amountPaid) < OrderHelper.getPayOut(totalBetAmount, profit)) {
          map1.set(key, value);
        }
      }
    });

    let mergedMap: Map<string, number> = new Map([...Array.from(map1.entries()), ...Array.from(map2.entries())]);

    const xien2Checked: any = [];
    const xien3Checked: any = [];
    const xien4Checked: any = [];
    this.checkXien({
      ordersXien2,
      ordersXien3,
      ordersXien4,
      prizesFinal: finalPrizeSpecial,
      mergeResult: mergedMap,
      type: 'giai-8',
      xien2Checked,
      xien3Checked,
      xien4Checked,
    });

    const [firstKey] = mergedMap.keys();
    const [firstValue] = mergedMap.values();

    let prizesSpecialAnd8 = [...finalPrizeSpecial, ...[{ number: firstKey, payOut: firstValue }]];

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizesSpecialAnd8,
    };
  }

  // getPrize8({
  //   totalBetAmount,
  //   ordersTruotXien4,
  //   ordersTruotXien8,
  //   ordersTruotXien10,
  //   prizes8,
  //   finalPrizeSpecial,
  //   ordersXien2,
  //   ordersXien3,
  //   ordersXien4,
  //   ordersXien2HasCounted,
  //   ordersXien3HasCounted,
  //   ordersXien4HasCounted,
  // }: any) {

  //   let resultLoTruotOfPrize8;
  //   ({
  //     totalBetAmount,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizes: resultLoTruotOfPrize8,
  //   } = this.checkLoTruot2({
  //     totalBetAmount,
  //     finalResult: finalPrizeSpecial,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizes: prizes8,
  //     ordersXien2HasCounted,
  //     ordersXien3HasCounted,
  //     ordersXien4HasCounted,
  //   }));

  //   let count = 0;
  //   const prizesSpecialAnd8 = [];

  //   // transform data
  //   const tempResultLoTruotOfPrize8 = resultLoTruotOfPrize8.reduce((init: any, currentValue: any) => {
  //     if (!currentValue.payOut || currentValue.payOut === 0) {
  //       init.resultHavePayout0.push(currentValue);
  //     } else {
  //       init.resultNotHavePayout0.push(currentValue);
  //     }

  //     return init;
  //   }, { resultHavePayout0: [], resultNotHavePayout0: [] });
  //   resultLoTruotOfPrize8 = [...tempResultLoTruotOfPrize8.resultNotHavePayout0, ...tempResultLoTruotOfPrize8.resultHavePayout0];

  //   resultLoTruotOfPrize8 = [...finalPrizeSpecial, ...resultLoTruotOfPrize8];
  //   let totalPayout = 0;
  //   for (const order of resultLoTruotOfPrize8) {
  //     if (count === 2) break;

  //     // if ((totalPayout + order?.payOut) >= ((totalBetAmount * 95) / 100)) {
  //     if ((totalPayout + order?.payOut) >= OrderHelper.getPayOut(totalBetAmount)) {
  //       continue;
  //     }

  //     let lastTwoDigits = order?.number.slice(-2);
  //     prizesSpecialAnd8.push(order);
  //     count++;
  //     totalPayout += order?.payOut;

  //     this.checkXienTemp({
  //       ordersXien2,
  //       ordersXien3,
  //       ordersXien4,
  //       prizesFinal: prizesSpecialAnd8,
  //       mergeResult: resultLoTruotOfPrize8,
  //       number: lastTwoDigits,
  //     });
  //   }

  //   return {
  //     totalBetAmount,
  //     ordersTruotXien4,
  //     ordersTruotXien8,
  //     ordersTruotXien10,
  //     prizesSpecialAnd8,
  //   };
  // }

  getPrizeSpecial({
    profit,
    totalBetAmount,
    ordersTruotXien4,
    ordersTruotXien8,
    ordersTruotXien10,
    prizesSpecial,
    ordersXien2HasCounted,
    ordersXien3HasCounted,
    ordersXien4HasCounted,
  }: any) {
    const finalPrizeSpecial1: any = [];

    let resultLoTruotOfPrizeSpecial;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: resultLoTruotOfPrizeSpecial,
    } = this.checkLoTruot({
      totalBetAmount,
      finalResult: finalPrizeSpecial1,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes: prizesSpecial,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
      type: 'giai-dac-biet',
    }));

    let map1: Map<string, number> = new Map();
    let map2: Map<string, number> = new Map();

    prizesSpecial.forEach((value: number, key: string) => {
      if (!value) {
        map2.set(key, value);
      } else {
        // if (value < (totalBetAmount * 95) / 100) {
        if (value < OrderHelper.getPayOut(totalBetAmount, profit)) {
          map1.set(key, value);
        }
      }
    });

    let mergedMap: Map<string, number> = new Map([...Array.from(map1.entries()), ...Array.from(map2.entries())]);

    const [firstKey] = mergedMap.keys();
    const [firstValue] = mergedMap.values();

    return {
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      finalPrizeSpecial: [{
        number: firstKey,
        payOut: firstValue,
      }],
    };
  }

  getFinalPrize({
    profit,
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
    let ordersXien2HasCounted: any = [];
    let ordersXien3HasCounted: any = [];
    let ordersXien4HasCounted: any = [];

    let finalPrizeSpecial;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      finalPrizeSpecial,
    } = this.getPrizeSpecial({
      profit,
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizesSpecial,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
    }));

    let prizesSpecialAnd8;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizesSpecialAnd8,
    } = this.getPrize8Temp({
      profit,
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizes8,
      finalPrizeSpecial,
      ordersXien2,
      ordersXien3,
      ordersXien4,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
    }));

    let prizesSpecialAnd8And7;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizesSpecialAnd8And7,
    } = this.getPrize7Temp({
      profit,
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      prizesSpecialAnd8,
      prizes7,
      ordersXien2,
      ordersXien3,
      ordersXien4,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
    }));

    let allPrizes;
    ({
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      allPrizes,
    } = this.getPrizeRemainsTemp({
      profit,
      totalBetAmount,
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
      remainPrizes,
      prizesSpecialAnd8And7,
      ordersXien2,
      ordersXien3,
      ordersXien4,
      ordersXien2HasCounted,
      ordersXien3HasCounted,
      ordersXien4HasCounted,
    }));

    return allPrizes;
  }

  getPrizes({
    profit,
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
    const totalAmountLoXienTruot = this.getTotalAmountLoXienTruot({
      ordersTruotXien4,
      ordersTruotXien8,
      ordersTruotXien10,
    });
    totalBetAmount = totalBetAmount - totalAmountLoXienTruot;

    let prizesSpecial = this.generatePrizesSpecial({
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

    let prizes8 = this.generatePrizes8({
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

    let prizes7 = this.generatePrizes7({
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

    let remainPrizes = this.generateRemainPrizes({
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

    // const finalResult = this.getFinalPrize({
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

    // return finalResult;

    let limit = 2;
    let count = 1;
    const result: any = [];

    while (true) {
      let tempPrizesSpecial = new Map(
        JSON.parse(
          JSON.stringify(Array.from(prizesSpecial))
        )
      );

      let tempPrize8 = new Map(
        JSON.parse(
          JSON.stringify(Array.from(prizes8))
        )
      );

      let tempPrize7 = new Map(
        JSON.parse(
          JSON.stringify(Array.from(prizes7))
        )
      );

      let tempRemainPrizes = new Map(
        JSON.parse(
          JSON.stringify(Array.from(remainPrizes))
        )
      );

      let tempOrdersTruotXien4 = JSON.parse(JSON.stringify(ordersTruotXien4));
      let tempOrdersTruotXien8 = JSON.parse(JSON.stringify(ordersTruotXien8));
      let tempOrdersTruotXien10 = JSON.parse(JSON.stringify(ordersTruotXien10));
      let tempOrdersXien2 = JSON.parse(JSON.stringify(ordersXien2));
      let tempOrdersXien3 = JSON.parse(JSON.stringify(ordersXien3));
      let tempOrdersXien4 = JSON.parse(JSON.stringify(ordersXien4));

      if (limit === 0) break;

      // if (limit !== 2) {
      let mapArray = Array.from(tempPrizesSpecial);
      const tempPrizesSpecial1 = mapArray.sort(() => Math.random() - 0.5);
      tempPrizesSpecial = new Map(tempPrizesSpecial1);

      let mapArray1 = Array.from(tempPrize8);
      const tempPrize81 = mapArray1.sort(() => Math.random() - 0.5);
      tempPrize8 = new Map(tempPrize81);

      let mapArray2 = Array.from(tempPrize7);
      const tempPrize71 = mapArray2.sort(() => Math.random() - 0.5);
      tempPrize7 = new Map(tempPrize71);

      let mapArray3 = Array.from(tempRemainPrizes);
      const tempRemainPrizes1 = mapArray3.sort(() => Math.random() - 0.5);
      tempRemainPrizes = new Map(tempRemainPrizes1);
      // }
      const finalResult = this.getFinalPrize({
        profit,
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

    return result1.sort((a: any, b: any) => b.totalPayout - a.totalPayout)[0];
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
      const pricePerOrderTruotXien4 = (order?.score || 0) * (OddBet.TruotXien4 * 1000);
      totalAmountLoXienTruot += pricePerOrderTruotXien4;
    }

    // truot 8
    for (const order of ordersTruotXien8) {
      const pricePerOrderTruotXien8 = (order?.score || 0) * (OddBet.TruotXien8 * 1000);
      totalAmountLoXienTruot += pricePerOrderTruotXien8;
    }

    // truot 10
    for (const order of ordersTruotXien10) {
      const pricePerOrderTruotXien10 = (order?.score || 0) * (OddBet.TruotXien10 * 1000);
      totalAmountLoXienTruot += pricePerOrderTruotXien10;
    }

    return totalAmountLoXienTruot;
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

    for (const order of (orders || [])) {
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
          if (newNumber.length >= 2) {
            const lastTwoDigits = newNumber.substr(-2);
            const lastTwoDigitsOfExcludeNumber = excludeNumber.substr(-2);
            condition = lastTwoDigits == lastTwoDigitsOfExcludeNumber;

            if (condition) break;
          }
        }
      }
    } while (condition)
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
                break;

              case BaoLoType.Lo2So1k:
                totalBetAmount += (totalScore * PricePerScore.Lo2So1k);
                break;

              case BaoLoType.Lo3So:
                totalBetAmount += (totalScore * PricePerScore.Lo3So);
                break;

              case BaoLoType.Lo4So:
                totalBetAmount += (totalScore * PricePerScore.Lo4So);
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
                break;

              case LoXienType.Xien3:
                totalBetAmount += (totalScore * PricePerScore.Xien3);
                break;

              case LoXienType.Xien4:
                totalBetAmount += (totalScore * PricePerScore.Xien4);
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
                break;

              case DanhDeType.DeDacBiet:
                totalBetAmount += (totalScore * PricePerScore.DeDacBiet);
                break;

              case DanhDeType.DeDauDuoi:
                totalBetAmount += (totalScore * PricePerScore.DeDauDuoi);
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
                break;

              case DauDuoiType.Dau:
                totalBetAmount += (totalScore * PricePerScore.Dau);
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
                break;

              case BaCangType.BaCangDauDuoi:
                totalBetAmount += (totalScore * PricePerScore.BaCangDauDuoi);
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
              case BonCangType.BonCangDacBiet:
                totalBetAmount += (totalScore * PricePerScore.BonCangDacBiet);
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
                totalBetAmount += (totalScore * PricePerScore.TruotXien4);
                break;

              case LoTruocType.TruotXien8:
                totalBetAmount += (totalScore * PricePerScore.TruotXien8);
                break;

              case LoTruocType.TruotXien10:
                totalBetAmount += (totalScore * PricePerScore.TruotXien10);
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
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Xiu:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Chan:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Le:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong0:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong1:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong2:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong3:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong4:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong5:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong6:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong7:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong8:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong9:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong10:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong11:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong12:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong13:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong14:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong15:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong16:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong17:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.Tong18:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.TongTai:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.TongXiu:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.TongChan:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
                      break;

                    case Lo2SoGiaiDacBietType.TongLe:
                      totalBetAmount += (order?.score || 0) * PricePerScore.TroChoiThuVi;
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

      return accumulator + Number(currentValue.score);
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
