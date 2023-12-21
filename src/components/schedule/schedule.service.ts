import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';
import { LotteriesService } from 'src/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { addDays, addMinutes, startOfDay } from 'date-fns';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import { TypeLottery } from 'src/system/constants';
import { BaoLoType, OddBet, PricePerScore } from 'src/system/enums/lotteries';
import { OrdersService } from '../orders/orders.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';


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
    ) { }

    onModuleInit() {
        console.log("init schedule");
        this.initJobs();
    }

    initJobs() {
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
            if (timeRunJob > (new Date()).getTime()) {
                count++;
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

        this.socketGateway.sendEventToClient(`${key}-receive-prizes`, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
        });

        this.handleBalance({
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
        key,
        prizes,
    }: { key: string, prizes: any }) {
        const [bookmakerId, gameType] = key.split('-');
        const userId = await this.redisService.get(`bookmaker-id-${bookmakerId}-users`);
        const keyOrdersOfBookmaker = `bookmaker-id-${bookmakerId}-${gameType}`;
        const ordersOfBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);

        if (!ordersOfBookmaker) return;

        let ordersOfUser;
        if (userId) {
            ordersOfUser = ordersOfBookmaker?.[`user-id-${userId}`] || null;
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

            promises.push(this.ordersService.update(+orderId, {
                paymentWin: balance,
                status: 'closed',
            }));
        }

        await Promise.all(promises);
        await this.redisService.del(keyOrdersOfBookmaker);

        const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
        const remainBalance = +wallet.balance + totalBalance;
        this.walletHandlerService.update(+userId, { balance: remainBalance });

        this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {
            // type: gameType,
        });
    }

    calcBalanceEachOrder({
        orders,
        typeBet,
        prizes,
    }: any) {
        let pointWin = 0;
        let pointLosed = 0;
        let balanceWin = 0;
        let balanceLosed = 0;
        for (const order in orders) {
            const times = this.findNumberOccurrencesOfPrize({ order, prizes });
            if (times > 0) {
                pointWin += (times * orders[order]);
            } else {
                pointLosed -= orders[order];
            }
        }

        switch (typeBet) {
            case BaoLoType.Lo2So:
                balanceWin += (pointWin * (OddBet.Lo2So * 1000));
                balanceLosed += (pointLosed * (PricePerScore.Lo2So));
                break;

            case BaoLoType.Lo2So1k:
                balanceWin += (pointWin * (OddBet.Lo2So1k * 1000));
                balanceLosed += (pointLosed * (PricePerScore.Lo2So1k));
                break;

            case BaoLoType.Lo3So:
                balanceWin += (pointWin * (OddBet.Lo3So * 1000));
                balanceLosed += (pointLosed * (PricePerScore.Lo3So));
                break;

            case BaoLoType.Lo4So:
                balanceWin += (pointWin * (OddBet.Lo4So * 1000));
                balanceLosed += (pointLosed * (PricePerScore.Lo4So));
                break;

            default:
                break;
        }

        return (balanceWin + balanceLosed);
    }

    findNumberOccurrencesOfPrize({
        order,
        prizes,
    }: any) {
        let count = 0;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < prizes[i].length; j++) {
                if (prizes[i][j].endsWith(order)) {
                    count++;
                }
            }
        }

        return count;
    }
}