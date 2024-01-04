import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';
import { LotteriesService } from 'src/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import { INIT_TIME_CREATE_JOB, TypeLottery } from 'src/system/constants';
import { BaCangType, BaoLoType, BonCangType, CategoryLotteryType, DanhDeType, DauDuoiType, Lo2SoGiaiDacBietType, LoTruocType, LoXienType, OddBet, PricePerScore, TroChoiThuViType } from 'src/system/enums/lotteries';
import { OrdersService } from '../orders/orders.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';
import { LotteryAwardService } from '../lottery.award/lottery.award.service';
import { DateTimeHelper } from 'src/helpers/date-time';
import { WinningNumbersService } from '../winning-numbers/winning-numbers.service';
import { OrderHelper } from 'src/common/helper';


@Injectable()
export class ScheduleService implements OnModuleInit {
    constructor(
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly redisService: RedisCacheService,
        private readonly lotteriesService: LotteriesService,
        private readonly socketGateway: SocketGatewayService,
        private readonly bookMakerService: BookMakerService,
        private readonly ordersService: OrdersService,
        private readonly walletHandlerService: WalletHandlerService,
        private readonly lotteryAwardService: LotteryAwardService,
        private readonly winningNumbersService: WinningNumbersService,
    ) { }

    onModuleInit() {
        console.log("init schedule");
        this.initJobs();
    }

    initJobs() {
        this.clearDataInRedis();
        this.deleteAllJob();
        this.createJobs(45);
        this.createJobs(60);
        this.createJobs(90);
        this.createJobs(120);
        this.createJobs(180);
        this.createJobs(360);
    }

    createJobs(seconds: number) {
        const time = `${(new Date()).toLocaleDateString()}, ${INIT_TIME_CREATE_JOB}`;
        const numberOfTurns = (17 * 60 * 60) / seconds;
        let timeRunJob = new Date(time).getTime();
        let count = 0;
        for (let i = 0; i < numberOfTurns; i++) {
            timeRunJob = timeRunJob + (seconds * 1000);
            count++;
            if (timeRunJob > (new Date()).getTime()) {
                const jobName = `${seconds}-${DateTimeHelper.formatDate((new Date()))}-${count}`;
                const turnIndex = `${DateTimeHelper.formatDate((new Date()))}-${count}`;
                const nextTurnIndex = `${DateTimeHelper.formatDate((new Date()))}-${count + 1}`;
                const nextTime = (timeRunJob + (seconds * 1000));
                this.addCronJob(jobName, seconds, timeRunJob, turnIndex, nextTurnIndex, nextTime);
            }
        }

        const tomorrow = startOfDay(addDays(new Date(), 1));
        const toDate = addMinutes(tomorrow, 6 * 60 + 40);
        const numberOfTurnsTomorrow = Math.round(((toDate.getTime() - tomorrow.getTime()) / 1000) / seconds);

        let tomorrowSeconds = tomorrow.getTime();
        let countOfNextDay = 0;
        for (let i = 0; i < numberOfTurnsTomorrow; i++) {
            countOfNextDay++;
            tomorrowSeconds = tomorrowSeconds + (seconds * 1000);
            const jobName = `${seconds}-${DateTimeHelper.formatDate(tomorrow)}-${countOfNextDay}`;
            const turnIndex = `${DateTimeHelper.formatDate(new Date())}-${countOfNextDay}`;
            const nextTurnIndex = `${DateTimeHelper.formatDate(new Date())}-${countOfNextDay + 1}`;
            const nextTime = (timeRunJob + (seconds * 1000));
            this.addCronJob(jobName, seconds, tomorrowSeconds, turnIndex, nextTurnIndex, nextTime);
        }
    }

    addCronJob(name: string, seconds: number, time: any, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const job = new CronJob(new Date((time)), () => {
            this.callbackFunc(name, seconds, time, turnIndex, nextTurnIndex, nextTime);
        });

        this.schedulerRegistry.addCronJob(name, job);
        job.start();
    }

    async callbackFunc(jobName: string, seconds: number, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        switch (seconds) {
            case 45:
                this.handle45s(jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            case 60:
                this.handle60s(jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            case 90:
                this.handle90s(jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            case 120:
                this.handle120s(jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            case 180:
                this.handle180s(jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            case 360:
                this.handle360s(jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            default:
                break;
        }
    }

    async handle45s(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const gameType = [
            TypeLottery.XSMB_45S,
            TypeLottery.XSMT_45S,
            TypeLottery.XSMN_45S,
            TypeLottery.XSSPL_45S,
        ];

        let promises = [];
        // TODO: xu ly truong hop co nhieu bookmaker
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const key = `${bookMaker.id}-${type}`;
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, key, type));
            }
        }

        await Promise.all(promises);

        this.deleteCron(jobName);
    }

    async handle60s(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const gameType = [
            TypeLottery.XSSPL_60S,
        ];

        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const key = `${bookMaker.id}-${type}`;
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, key, type));
            }
        }

        await Promise.all(promises);

        this.deleteCron(jobName);
    }

    async handle90s(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const gameType = [
            TypeLottery.XSSPL_90S,
        ];

        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const key = `${bookMaker.id}-${type}`;
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, key, type));
            }
        }

        await Promise.all(promises);

        this.deleteCron(jobName);
    }

    async handle120s(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const gameType = [
            TypeLottery.XSSPL_120S,
        ];

        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const key = `${bookMaker.id}-${type}`;
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, key, type));
            }
        }

        await Promise.all(promises);

        this.deleteCron(jobName);
    }

    async handle180s(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const gameType = [
            TypeLottery.XSMB_180S,
            TypeLottery.XSMT_180S,
            TypeLottery.XSMN_180S,
        ];

        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const key = `${bookMaker.id}-${type}`;
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, key, type));
            }
        }

        await Promise.all(promises);

        this.deleteCron(jobName);
    }

    async handle360s(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const gameType = [
            TypeLottery.XSSPL_360S,
        ];

        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const key = `${bookMaker.id}-${type}`;
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, key, type));
            }
        }

        await Promise.all(promises);

        this.deleteCron(jobName);
    }

    async processingData(time: number, turnIndex: string, nextTurnIndex: string, nextTime: number, key: string, gameType: string) {
        let data = await this.redisService.get(key);
        await this.redisService.del(key);
        if (!data) {
            data = [];
        }

        const dataTransform = this.transformData(data);
        const prizes = this.lotteriesService.generatePrizes(dataTransform);
        const finalResult = this.lotteriesService.randomPrizes(prizes);

        this.lotteryAwardService.createLotteryAward({
            turnIndex,
            type: gameType,
            awardDetail: JSON.stringify(finalResult),
        });

        // key = bookmakerId-gameType
        this.socketGateway.sendEventToClient(`${key}-receive-prizes`, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
        });

        // calc balance
        this.handleBalance({
            turnIndex,
            key,
            prizes: finalResult,
        });
    }

    transformData(data: any) {
        const orders: any = [];
        let dataOrders: any = {};
        for (const categoryLotteryType in data) {
            dataOrders = {
                categoryLotteryType,
                data: [] as any,
            };
            for (const type in data[categoryLotteryType]) {
                const dataChild = {
                    type,
                    data: [] as any,
                };
                switch (type) {
                    case BaoLoType.Lo2So:
                    case BaoLoType.Lo2So1k:
                    case BaoLoType.Lo3So:
                    case BaoLoType.Lo4So:
                    case DanhDeType.DeDau:
                    case DanhDeType.DeDacBiet:
                    case DanhDeType.DeDauDuoi:
                    case TroChoiThuViType.Lo2SoGiaiDacBiet:
                        for (const number in data[categoryLotteryType][type]) {
                            const item = {
                                score: data[categoryLotteryType][type][number],
                                number: number,
                            };
                            dataChild.data.push(item);
                        }
                        break;

                    case LoXienType.Xien2:
                    case LoXienType.Xien3:
                    case LoXienType.Xien4:
                    case LoTruocType.TruotXien4:
                    case LoTruocType.TruotXien8:
                    case LoTruocType.TruotXien10:
                        for (const number in data[categoryLotteryType][type]) {
                            const item = {
                                score: data[categoryLotteryType][type][number],
                                number: JSON.parse(number),
                            };
                            dataChild.data.push(item);
                        }
                        break;

                    default:
                        break;
                }

                dataOrders.data.push(dataChild);
            }

            orders.push(dataOrders);
        }

        return orders;
    }

    deleteCron(name: string) {
        this.schedulerRegistry.deleteCronJob(name);
        console.log(`job ${name} deleted!`);
    }

    deleteAllJob() {
        console.log("delete all job.");
        const jobs = this.schedulerRegistry.getCronJobs();
        jobs.forEach((value, key, map) => {
            this.schedulerRegistry.deleteCronJob(key);
        });
    }

    @Cron('40 6 * * * ')
    cronJob() {
        this.initJobs();
    }

    async handleBalance({
        turnIndex,
        key,
        prizes,
    }: { turnIndex: string, key: string, prizes: any }) {
        const [bookmakerId, gameType] = key.split('-');

        // get all userId of bookmaker
        let userIds: any = await this.redisService.get(`bookmaker-id-${bookmakerId}-users`);
        if (!userIds) return;

        // get orders of bookmaker by game type (example: sxmb45s)
        const keyOrdersOfBookmaker = `bookmaker-id-${bookmakerId}-${gameType}`;
        const ordersOfBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);
        if (!ordersOfBookmaker || Object.keys(ordersOfBookmaker).length === 0) {
            console.log(`orders of bookmakerId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
            return;
        }

        for (const userId of userIds) {
            let ordersOfUser;
            if (userId) {
                ordersOfUser = ordersOfBookmaker?.[`user-id-${userId}`] || null;
            }

            if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
                console.log(`orders of userId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
                continue;
            }

            const promises = [];
            let totalBalance = 0;
            const promisesCreateWinningNumbers = [];
            for (const key in ordersOfUser) {
                const [orderId, region, typeBet] = key.split('-');
                const { realWinningAmount, winningNumbers, winningAmount } = this.calcBalanceEachOrder({
                    orders: ordersOfUser[key],
                    typeBet,
                    prizes,
                    orderId,
                    turnIndex,
                });

                totalBalance += winningAmount;

                if (winningNumbers.length > 0) {
                    promisesCreateWinningNumbers.push(
                        this.winningNumbersService.create({
                            winningNumbers: JSON.stringify(winningNumbers),
                            turnIndex,
                            order: {
                                id: orderId
                            } as any,
                            type: gameType,
                        }),
                    );
                }

                promises.push(this.ordersService.update(
                    +orderId,
                    {
                        paymentWin: realWinningAmount,
                        status: 'closed',
                    },
                    null,
                ));
            }

            // save winning numbers
            Promise.all(promisesCreateWinningNumbers);

            await Promise.all(promises);

            const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
            const remainBalance = +wallet.balance + totalBalance;
            await this.walletHandlerService.updateWalletByUserId(+userId, { balance: remainBalance });

            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {});
        }
        await this.redisService.del(keyOrdersOfBookmaker);
    }

    calcBalanceEachOrder({
        orders,
        typeBet,
        prizes,
    }: any) {
        let winningPoint = 0;
        let winningAmount = 0;
        let betAmount = 0;
        let totalPoint = 0;
        let count = 0;
        let winningNumbers = [];

        for (const order in orders) {
            totalPoint += orders[order];
            ({ count, winningNumbers } = this.findNumberOccurrencesOfPrizes({ order, prizes, typeBet, winningNumbers }));
            if (count > 0) {
                winningPoint += (count * orders[order]);
            }
        }

        switch (typeBet) {
            case BaoLoType.Lo2So:
                winningAmount += (winningPoint * (OddBet.Lo2So * 1000));
                betAmount += (totalPoint * (PricePerScore.Lo2So));
                break;

            case BaoLoType.Lo2So1k:
                winningAmount += (winningPoint * (OddBet.Lo2So1k * 1000));
                betAmount += (totalPoint * (PricePerScore.Lo2So1k));
                break;

            case DanhDeType.DeDau:
                winningAmount += (winningPoint * (OddBet.DeDau * 1000));
                betAmount += (totalPoint * (PricePerScore.DeDau));
                break;

            case DanhDeType.DeDacBiet:
                winningAmount += (winningPoint * (OddBet.DeDacBiet * 1000));
                betAmount += (totalPoint * (PricePerScore.DeDacBiet));
                break;

            case DanhDeType.DeDauDuoi:
                winningAmount += (winningPoint * (OddBet.DeDauDuoi * 1000));
                betAmount += (totalPoint * (PricePerScore.DeDauDuoi));
                break;

            case BaoLoType.Lo3So:
                winningAmount += (winningPoint * (OddBet.Lo3So * 1000));
                betAmount += (totalPoint * (PricePerScore.Lo3So));
                break;

            case BaCangType.BaCangDau:
                winningAmount += (winningPoint * (OddBet.BaCangDau * 1000));
                betAmount += (totalPoint * (PricePerScore.BaCangDau));
                break;

            case BaCangType.BaCangDacBiet:
                winningAmount += (winningPoint * (OddBet.BaCangDacBiet * 1000));
                betAmount += (totalPoint * (PricePerScore.BaCangDacBiet));
                break;

            case BaCangType.BaCangDauDuoi:
                winningAmount += (winningPoint * (OddBet.BaCangDauDuoi * 1000));
                betAmount += (totalPoint * (PricePerScore.BaCangDauDuoi));
                break;

            case BaoLoType.Lo4So:
                winningAmount += (winningPoint * (OddBet.Lo4So * 1000));
                betAmount += (totalPoint * (PricePerScore.Lo4So));
                break;

            case BonCangType.BonCangDacBiet:
                winningAmount += (winningPoint * (OddBet.BonCangDacBiet * 1000));
                betAmount += (totalPoint * (PricePerScore.BonCangDacBiet));
                break;

            case LoXienType.Xien2:
                winningAmount += (winningPoint * (OddBet.Xien2 * 1000));
                betAmount += (totalPoint * (PricePerScore.Xien2));
                break;

            case LoXienType.Xien3:
                winningAmount += (winningPoint * (OddBet.Xien3 * 1000));
                betAmount += (totalPoint * (PricePerScore.Xien3));
                break;

            case LoXienType.Xien4:
                winningAmount += (winningPoint * (OddBet.Xien4 * 1000));
                betAmount += (totalPoint * (PricePerScore.Xien4));
                break;

            case LoTruocType.TruotXien4:
                winningAmount += (winningPoint * (OddBet.TruotXien4 * 1000));
                betAmount += (totalPoint * (PricePerScore.TruotXien4));
                break;


            case LoTruocType.TruotXien8:
                winningAmount += (winningPoint * (OddBet.TruotXien8 * 1000));
                betAmount += (totalPoint * (PricePerScore.TruotXien8));
                break;

            case LoTruocType.TruotXien10:
                winningAmount += (winningPoint * (OddBet.TruotXien10 * 1000));
                betAmount += (totalPoint * (PricePerScore.TruotXien10));
                break;

            case DauDuoiType.Dau:
                winningAmount += (winningPoint * (OddBet.Dau * 1000));
                betAmount += (totalPoint * (PricePerScore.Dau));
                break;

            case DauDuoiType.Duoi:
                winningAmount += (winningPoint * (OddBet.Duoi * 1000));
                betAmount += (totalPoint * (PricePerScore.Duoi));
                break;

            case TroChoiThuViType.Lo2SoGiaiDacBiet:
                betAmount += (totalPoint * (PricePerScore.TroChoiThuVi));
                if (winningNumbers.length > 0) {
                    switch (winningNumbers[0]) {
                        case Lo2SoGiaiDacBietType.Tai:
                            winningAmount += (winningPoint * (OddBet.Tai * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Xiu:
                            winningAmount += (winningPoint * (OddBet.Xiu * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Chan:
                            winningAmount += (winningPoint * (OddBet.Chan * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Le:
                            winningAmount += (winningPoint * (OddBet.Le * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong0:
                            winningAmount += (winningPoint * (OddBet.Tong0 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong1:
                            winningAmount += (winningPoint * (OddBet.Tong1 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong2:
                            winningAmount += (winningPoint * (OddBet.Tong2 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong3:
                            winningAmount += (winningPoint * (OddBet.Tong3 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong4:
                            winningAmount += (winningPoint * (OddBet.Tong4 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong5:
                            winningAmount += (winningPoint * (OddBet.Tong5 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong6:
                            winningAmount += (winningPoint * (OddBet.Tong6 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong7:
                            winningAmount += (winningPoint * (OddBet.Tong7 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong8:
                            winningAmount += (winningPoint * (OddBet.Tong8 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong9:
                            winningAmount += (winningPoint * (OddBet.Tong9 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong10:
                            winningAmount += (winningPoint * (OddBet.Tong10 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong11:
                            winningAmount += (winningPoint * (OddBet.Tong11 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong12:
                            winningAmount += (winningPoint * (OddBet.Tong12 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong13:
                            winningAmount += (winningPoint * (OddBet.Tong13 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong14:
                            winningAmount += (winningPoint * (OddBet.Tong14 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong15:
                            winningAmount += (winningPoint * (OddBet.Tong15 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong16:
                            winningAmount += (winningPoint * (OddBet.Tong16 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong17:
                            winningAmount += (winningPoint * (OddBet.Tong17 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.Tong18:
                            winningAmount += (winningPoint * (OddBet.Tong18 * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.TongTai:
                            winningAmount += (winningPoint * (OddBet.TongTai * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.TongXiu:
                            winningAmount += (winningPoint * (OddBet.TongXiu * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.TongChan:
                            winningAmount += (winningPoint * (OddBet.TongChan * 1000));
                            break;

                        case Lo2SoGiaiDacBietType.TongLe:
                            winningAmount += (winningPoint * (OddBet.TongLe * 1000));
                            break;

                        default:
                            break;
                    }
                }
                break;

            default:
                break;
        }

        return {
            winningAmount,
            winningNumbers,
            realWinningAmount: (winningAmount - betAmount),
        };
    }

    findNumberOccurrencesOfPrizes({
        order,
        prizes,
        typeBet,
        winningNumbers,
    }: any) {
        let count = 0;
        let lastTwoDigits;
        let isValidOrder = false;

        switch (typeBet) {
            case BaoLoType.Lo2So:
            case BaoLoType.Lo2So1k:
            case BaoLoType.Lo3So:
            case BaoLoType.Lo4So:
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < prizes[i].length; j++) {
                        if (prizes[i][j].endsWith(order)) {
                            count++;
                            winningNumbers.push(order);
                        }
                    }
                }
                break;

            case DanhDeType.DeDau:
                for (let j = 0; j < prizes[8].length; j++) {
                    if (prizes[8][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case DanhDeType.DeDacBiet:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case DanhDeType.DeDauDuoi:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                for (let j = 0; j < prizes[8].length; j++) {
                    if (prizes[8][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case BaCangType.BaCangDau:
                for (let j = 0; j < prizes[7].length; j++) {
                    if (prizes[7][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case BaCangType.BaCangDacBiet:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case BaCangType.BaCangDauDuoi:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                for (let j = 0; j < prizes[7].length; j++) {
                    if (prizes[7][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case BonCangType.BonCangDacBiet:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                        winningNumbers.push(order);
                    }
                }
                break;

            case LoXienType.Xien2:
            case LoXienType.Xien3:
            case LoXienType.Xien4:
                let tempCount = 0;
                const numbers = order.split(',');
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < prizes[i].length; j++) {
                        for (const number of numbers) {
                            if (prizes[i][j].endsWith(number.trim())) {
                                tempCount++;
                            }
                        }
                    }
                }

                if (tempCount === numbers.length) {
                    count++;
                    winningNumbers.push(order);
                }
                break;

            case LoTruocType.TruotXien4:
            case LoTruocType.TruotXien8:
            case LoTruocType.TruotXien10:
                let tempCountTruotXien = 0;
                const numbersTruotXien = order.split(',');
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < prizes[i].length; j++) {
                        for (const number of numbersTruotXien) {
                            if (!prizes[i][j].endsWith(number.trim())) {
                                tempCountTruotXien++;
                            }
                        }
                    }
                }

                if (tempCountTruotXien === numbersTruotXien.length) {
                    count++;
                    winningNumbers.push(order);
                }
                break;

            case DauDuoiType.Dau:
                lastTwoDigits = prizes[0][0].slice(-2);
                isValidOrder = false;
                if (order) {
                    isValidOrder = lastTwoDigits.startsWith(order.toString());
                }

                if (isValidOrder) {
                    count++;
                    winningNumbers.push(order);
                }
                break;

            case DauDuoiType.Duoi:
                lastTwoDigits = prizes[0][0].slice(-2);
                isValidOrder = false;
                if (order) {
                    isValidOrder = lastTwoDigits.endsWith(order.toString());
                }

                if (isValidOrder) {
                    count++;
                    winningNumbers.push(order);
                }
                break;

            case TroChoiThuViType.Lo2SoGiaiDacBiet:
                const winningPatterns = OrderHelper.getWinningPatternsFromPrizes(prizes);
                const hasNumber = winningPatterns.find((ord: any) => ord === order);
                if (hasNumber) {
                    count++;
                    winningNumbers.push(order);
                }
                break;

            default:
                break;
        }

        return {
            count,
            winningNumbers,
        };
    }

    async clearDataInRedis() {
        console.log("clear data in redis");
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const typeLottery = Object.values(TypeLottery);
        const promises = [];
        for (const bookMaker of bookMakers) {
            for (const key in typeLottery) {
                promises.push(this.redisService.del(`bookmaker-id-${bookMaker.id}-${typeLottery[key]}`));
                promises.push(this.redisService.del(`${bookMaker.id}-${typeLottery[key]}`));
            }
        }

        await Promise.all(promises);
    }
}