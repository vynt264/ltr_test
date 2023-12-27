import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';
import { LotteriesService } from 'src/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import { TypeLottery } from 'src/system/constants';
import { BaCangType, BaoLoType, BonCangType, DanhDeType, OddBet, PricePerScore } from 'src/system/enums/lotteries';
import { OrdersService } from '../orders/orders.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';
import { LotteryAwardService } from '../lottery.award/lottery.award.service';


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
        const time = `${(new Date()).toLocaleDateString()}, 07:00 AM`;
        const numberOfTurns = (17 * 60 * 60) / seconds;
        let timeRunJob = new Date(time).getTime();
        let count = 0;
        for (let i = 0; i < numberOfTurns; i++) {
            timeRunJob = timeRunJob + (seconds * 1000);
            count++;
            if (timeRunJob > (new Date()).getTime()) {
                const jobName = `${seconds}-${(new Date()).toLocaleDateString()}-${count}`;
                const turnIndex = `${(new Date()).toLocaleDateString()}-${count}`;
                const nextTurnIndex = `${(new Date()).toLocaleDateString()}-${count + 1}`;
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
            const jobName = `${seconds}-${(tomorrow).toLocaleDateString()}-${countOfNextDay}`;
            const turnIndex = `${(new Date()).toLocaleDateString()}-${countOfNextDay}`;
            const nextTurnIndex = `${(new Date()).toLocaleDateString()}-${countOfNextDay + 1}`;
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

        this.handleBalance({
            turnIndex,
            key,
            prizes: finalResult,
        });
    }

    transformData(data: any) {
        const orders: any = [];
        for (const categoryLotteryType in data) {
            const dataOrders: any = {
                categoryLotteryType,
                data: [] as any,
            };
            for (const type in data[categoryLotteryType]) {
                const dataChild = {
                    type,
                    data: [] as any,
                };
                for (const order in data[categoryLotteryType][type]) {
                    const item = {
                        score: data[categoryLotteryType][type][order],
                        number: order,
                    };
                    dataChild.data.push(item);
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
        let userIds: any = await this.redisService.get(`bookmaker-id-${bookmakerId}-users`);
        if (!userIds) return;

        const keyOrdersOfBookmaker = `bookmaker-id-${bookmakerId}-${gameType}`;
        const ordersOfBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);
        if (!ordersOfBookmaker) {
            console.log(`orders of bookmakerId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
            return;
        }

        for (const userId of userIds) {
            let ordersOfUser;
            if (userId) {
                ordersOfUser = ordersOfBookmaker?.[`user-id-${userId}`] || null;
            }

            if (!ordersOfUser) {
                console.log(`orders of userId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
                continue;
            }

            const promises = [];
            let totalBalance = 0;
            for (const key in ordersOfUser) {
                const [orderId, region, typeBet] = key.split('-');
                const balance = this.calcBalanceEachOrder({
                    orders: ordersOfUser[key],
                    typeBet,
                    prizes,
                });

                totalBalance += balance;

                promises.push(this.ordersService.update(
                    +orderId,
                    {
                        paymentWin: balance,
                        status: 'closed',
                    },
                    null,
                ));
            }

            await Promise.all(promises);

            const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
            const remainBalance = +wallet.balance + totalBalance;
            this.walletHandlerService.update(+userId, { balance: remainBalance });

            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {});
        }
        await this.redisService.del(keyOrdersOfBookmaker);
    }

    calcBalanceEachOrder({
        orders,
        typeBet,
        prizes,
    }: any) {
        let pointWin = 0;
        let balanceWin = 0;
        let balanceLosed = 0;
        let totalPoint = 0;
        for (const order in orders) {
            totalPoint += orders[order];
            const times = this.findNumberOccurrencesOfPrize({ order, prizes, typeBet });
            if (times > 0) {
                pointWin += (times * orders[order]);
            }
        }

        switch (typeBet) {
            case BaoLoType.Lo2So:
                balanceWin += (pointWin * (OddBet.Lo2So * 1000));
                balanceLosed += (totalPoint * (PricePerScore.Lo2So));
                break;

            case BaoLoType.Lo2So1k:
                balanceWin += (pointWin * (OddBet.Lo2So1k * 1000));
                balanceLosed += (totalPoint * (PricePerScore.Lo2So1k));
                break;

            case DanhDeType.DeDau:
                balanceWin += (pointWin * (OddBet.DeDau * 1000));
                balanceLosed += (totalPoint * (PricePerScore.DeDau));
                break;

            case DanhDeType.DeDacBiet:
                balanceWin += (pointWin * (OddBet.DeDacBiet * 1000));
                balanceLosed += (totalPoint * (PricePerScore.DeDacBiet));
                break;

            case DanhDeType.DeDauDuoi:
                balanceWin += (pointWin * (OddBet.DeDauDuoi * 1000));
                balanceLosed += (totalPoint * (PricePerScore.DeDauDuoi));
                break;

            case BaoLoType.Lo3So:
                balanceWin += (pointWin * (OddBet.Lo3So * 1000));
                balanceLosed += (totalPoint * (PricePerScore.Lo3So));
                break;

            case BaCangType.BaCangDau:
                balanceWin += (pointWin * (OddBet.BaCangDau * 1000));
                balanceLosed += (totalPoint * (PricePerScore.BaCangDau));
                break;

            case BaCangType.BaCangDacBiet:
                balanceWin += (pointWin * (OddBet.BaCangDacBiet * 1000));
                balanceLosed += (totalPoint * (PricePerScore.BaCangDacBiet));
                break;

            case BaCangType.BaCangDauDuoi:
                balanceWin += (pointWin * (OddBet.BaCangDauDuoi * 1000));
                balanceLosed += (totalPoint * (PricePerScore.BaCangDauDuoi));
                break;

            case BaoLoType.Lo4So:
                balanceWin += (pointWin * (OddBet.Lo4So * 1000));
                balanceLosed += (totalPoint * (PricePerScore.Lo4So));
                break;

            case BonCangType.BonCangDacBiet:
                balanceWin += (pointWin * (OddBet.BonCangDacBiet * 1000));
                balanceLosed += (totalPoint * (PricePerScore.BonCangDacBiet));
                break;

            default:
                break;
        }

        return (balanceWin - balanceLosed);
    }

    findNumberOccurrencesOfPrize({
        order,
        prizes,
        typeBet,
    }: any) {
        let count = 0;

        switch (typeBet) {
            case BaoLoType.Lo2So:
            case BaoLoType.Lo2So1k:
            case BaoLoType.Lo3So:
            case BaoLoType.Lo4So:
                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < prizes[i].length; j++) {
                        if (prizes[i][j].endsWith(order)) {
                            count++;
                        }
                    }
                }
                break;

            case DanhDeType.DeDau:
                for (let j = 0; j < prizes[8].length; j++) {
                    if (prizes[8][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            case DanhDeType.DeDacBiet:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            case DanhDeType.DeDauDuoi:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                    }
                }
                for (let j = 0; j < prizes[8].length; j++) {
                    if (prizes[8][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            case BaCangType.BaCangDau:
                for (let j = 0; j < prizes[7].length; j++) {
                    if (prizes[7][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            case BaCangType.BaCangDacBiet:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            case BaCangType.BaCangDauDuoi:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                    }
                }
                for (let j = 0; j < prizes[7].length; j++) {
                    if (prizes[7][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            case BonCangType.BonCangDacBiet:
                for (let j = 0; j < prizes[0].length; j++) {
                    if (prizes[0][j].endsWith(order)) {
                        count++;
                    }
                }
                break;

            default:
                break;
        }

        return count;
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