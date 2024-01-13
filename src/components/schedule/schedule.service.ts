import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';
import { LotteriesService } from 'src/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import { INIT_TIME_CREATE_JOB, MAINTENANCE_PERIOD, PERIOD_DELAY_TO_HANDLER_ORDERS, TypeLottery } from 'src/system/constants';
import { BaCangType, BaoLoType, BonCangType, CategoryLotteryType, DanhDeType, DauDuoiType, Lo2SoGiaiDacBietType, LoTruocType, LoXienType, OddBet, PricePerScore, TroChoiThuViType } from 'src/system/enums/lotteries';
import { OrdersService } from '../orders/orders.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';
import { LotteryAwardService } from '../lottery.award/lottery.award.service';
import { DateTimeHelper } from 'src/helpers/date-time';
import { WinningNumbersService } from '../winning-numbers/winning-numbers.service';
import { OrderHelper } from 'src/common/helper';
import { HoldingNumbersService } from '../holding-numbers/holding-numbers.service';


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
        private readonly holdingNumbersService: HoldingNumbersService,
    ) { }

    onModuleInit() {
        console.log("init schedule");
        this.initJobs();
    }

    async initJobs() {
        let promises: any = [];
        await this.clearDataInRedis();
        this.deleteAllJob();
        console.log("init job start");
        promises = promises.concat(this.createJobs(45));
        promises = promises.concat(this.createJobs(60));
        promises = promises.concat(this.createJobs(90));
        promises = promises.concat(this.createJobs(120));
        promises = promises.concat(this.createJobs(180));
        promises = promises.concat(this.createJobs(360));
        console.log("init job finished");

        console.log("create awards start");
        await Promise.all(promises);
        console.log("create awards finished");
    }

    async createJobs(seconds: number) {
        const timeStartRunJob = `${(new Date()).toLocaleDateString()}, ${INIT_TIME_CREATE_JOB}`;
        let timeMillisecondsStartRunJob = new Date(timeStartRunJob).getTime();
        const numberOfTurns = Math.round((((24 * 60 * 60) - (MAINTENANCE_PERIOD * 60)) / seconds));
        let count = 0;
        let promises: any = [];
        for (let i = 0; i < numberOfTurns; i++) {
            timeMillisecondsStartRunJob = timeMillisecondsStartRunJob + (seconds * 1000);
            count++;
            const turnIndex = `${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${count}`;
            if (timeMillisecondsStartRunJob > (new Date()).getTime()) {
                const jobName = `${seconds}-${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${count}`;
                const nextTurnIndex = `${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${count + 1}`;
                const nextTime = (timeMillisecondsStartRunJob + (seconds * 1000));
                this.addCronJob(jobName, seconds, timeMillisecondsStartRunJob, turnIndex, nextTurnIndex, nextTime);
            }
            else {
                const tempPromises = await this.createLotteryAwardInPastTime(turnIndex, seconds);
                promises = promises.concat(tempPromises);
            }
        }

        return promises;
    }

    addCronJob(name: string, seconds: number, time: any, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const job = new CronJob(new Date((time)), () => {
            this.callbackFunc(name, seconds, time, turnIndex, nextTurnIndex, nextTime);
        });

        this.schedulerRegistry.addCronJob(name, job);
        job.start();
    }

    async callbackFunc(jobName: string, seconds: number, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        await OrderHelper.delay(PERIOD_DELAY_TO_HANDLER_ORDERS);
        this.handlerJobs(jobName, time, turnIndex, nextTurnIndex, nextTime, seconds);
    }

    async handlerJobs(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number, seconds: number) {
        let gameType;
        switch (seconds) {
            case 45:
                gameType = [
                    TypeLottery.XSMB_45S,
                    TypeLottery.XSMT_45S,
                    TypeLottery.XSMN_45S,
                    TypeLottery.XSSPL_45S,
                ];
                break;

            case 60:
                gameType = [
                    TypeLottery.XSSPL_60S,
                ];
                break;

            case 90:
                gameType = [
                    TypeLottery.XSSPL_90S,
                ];
                break;

            case 120:
                gameType = [
                    TypeLottery.XSSPL_120S,
                ];
                break;

            case 180:
                gameType = [
                    TypeLottery.XSMB_180S,
                    TypeLottery.XSMT_180S,
                    TypeLottery.XSMN_180S,
                ];
                break;

            case 360:
                gameType = [
                    TypeLottery.XSSPL_360S,
                ];
                break;
        }

        const bookMakers = await this.bookMakerService.getAllBookMaker();

        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, type, bookMaker.id));
            }
        }

        await Promise.all(promises);

        this.finishJob(jobName);
    }

    async processingData(time: number, turnIndex: string, nextTurnIndex: string, nextTime: number, gameType: string, bookmakerId: number) {
        // event reload tao ke hoach theo doi so
        this.socketGateway.sendEventToClient(`${bookmakerId}-${gameType}-reload-list-tracked-number`, {});

        const keyToGetOrders = OrderHelper.getKeyPrepareOrders(bookmakerId.toString(), gameType, turnIndex);
        const keyToGetOrdersOfTestPlayer = OrderHelper.getKeyPrepareOrdersOfTestPlayer(bookmakerId.toString(), gameType, turnIndex);
        let data = await this.redisService.get(keyToGetOrders);
        let dataOfTestPlayer = await this.redisService.get(keyToGetOrdersOfTestPlayer);
        await this.redisService.del(keyToGetOrders);
        if (!data) {
            data = [];
        }
        if (!dataOfTestPlayer) {
            dataOfTestPlayer = [];
        }

        // real users
        const dataTransform = this.transformData(data);
        const prizes = this.lotteriesService.generatePrizes(dataTransform);
        const finalResult = this.lotteriesService.randomPrizes(prizes);
        this.lotteryAwardService.createLotteryAward({
            turnIndex,
            type: gameType,
            awardDetail: JSON.stringify(finalResult),
            bookmaker: { id: bookmakerId } as any,
            isTestPlayer: false,
        });
        const eventSendAwards = `${bookmakerId}-${gameType}-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwards, {
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
            prizes: finalResult,
            bookmakerId,
            gameType,
        });

        // fake users
        const dataTransformOfFakeUsers = this.transformData(dataOfTestPlayer);
        const prizesOfFakeUsers = this.lotteriesService.generatePrizes(dataTransformOfFakeUsers);
        const finalResultOfFakeUsers = this.lotteriesService.randomPrizes(prizesOfFakeUsers);
        this.lotteryAwardService.createLotteryAward({
            turnIndex,
            type: gameType,
            awardDetail: JSON.stringify(finalResultOfFakeUsers),
            bookmaker: { id: bookmakerId } as any,
            isTestPlayer: true,
        });
        const eventSendAwardsOfFakeUsers = `${bookmakerId}-${gameType}-test-player-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwardsOfFakeUsers, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResultOfFakeUsers,
        });
        // calc balance of fake users
        this.handleBalanceFakeUsers({
            turnIndex,
            prizes: finalResultOfFakeUsers,
            bookmakerId,
            gameType,
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

    finishJob(name: string) {
        console.log(`job ${name} finished!`);
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
        console.log('cron job');
        this.initJobs();
    }

    async handleBalance({
        turnIndex,
        prizes,
        bookmakerId,
        gameType,
    }: { turnIndex: string, prizes: any, bookmakerId: number, gameType: string }) {

        // get all userId of bookmaker
        const keyGetUserIds = OrderHelper.getKeySaveUserIdsByBookmaker(bookmakerId.toString());
        let userIds: any = await this.redisService.get(keyGetUserIds);
        if (!userIds) return;

        // get orders of bookmaker by game type (example: sxmb45s)
        const keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), gameType);
        const ordersOfBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);
        if (!ordersOfBookmaker || Object.keys(ordersOfBookmaker).length === 0) {
            console.log(`orders of bookmakerId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
            return;
        }

        const winningPlayerOrders = []; // don hang users thang cuoc.

        for (const userId of userIds) {
            let ordersOfUser;
            if (userId) {
                ordersOfUser = ordersOfBookmaker?.[`user-id-${userId}-${turnIndex}`] || null;
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

                // user win vs order hien tai
                winningPlayerOrders.push(orderId);

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
                            isTestPlayer: false,
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

            // check nuoi so
            this.handlerHoldingNumbers({
                winningPlayerOrders,
                bookmakerId,
                userId,
                usernameReal: false,
            });

            const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
            const remainBalance = +wallet.balance + totalBalance;
            await this.walletHandlerService.updateWalletByUserId(+userId, { balance: remainBalance });

            console.log(`userId ${userId} send event payment`);
            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {});
        }
        //await this.redisService.del(keyOrdersOfBookmaker);
    }

    async handlerHoldingNumbers({
        winningPlayerOrders,
        bookmakerId,
        userId,
        usernameReal,
    }: any) {
        if (!winningPlayerOrders || winningPlayerOrders.length === 0) return;

        const promises = [];

        for (const orderId of winningPlayerOrders) {
            const order = await this.ordersService.findOne(+orderId);
            if (!order?.holdingNumber?.id) continue;

            const holdingNumber = await this.holdingNumbersService.findOne(+order.holdingNumber.id);

            if (!holdingNumber.isStop) return;

            const orders = await this.ordersService.findOrdersByHoldingNumberId(holdingNumber.id);

            if (orders || orders.length === 0) return;

            for (const order of orders) {
                const tempOrder = await this.ordersService.findOne(order.id);
                if (tempOrder.status === 'canceled' || tempOrder.status === 'closed') continue;

                await this.ordersService.removeOrderFromRedis({
                    order,
                    bookmakerId,
                    userId,
                    usernameReal,
                });

                promises.push(
                    this.ordersService.delete(order.id),
                );
            }
        }

        await Promise.all(promises);
    }

    async handleBalanceFakeUsers({
        turnIndex,
        prizes,
        bookmakerId,
        gameType,
    }: { turnIndex: string, prizes: any, bookmakerId: number, gameType: string }) {

        // get all userId of bookmaker
        const keyGetUserIds = OrderHelper.getKeySaveUserIdsFakeByBookmaker(bookmakerId.toString());
        let userIds: any = await this.redisService.get(keyGetUserIds);
        if (!userIds) return;

        // get orders of bookmaker by game type (example: sxmb45s)
        const keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), gameType);
        const ordersOfBookmaker: any = await this.redisService.get(keyOrdersOfBookmaker);
        if (!ordersOfBookmaker || Object.keys(ordersOfBookmaker).length === 0) {
            console.log(`orders fake of bookmakerId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
            return;
        }

        for (const userId of userIds) {
            let ordersOfUser;
            if (userId) {
                ordersOfUser = ordersOfBookmaker?.[`user-id-${userId}-${turnIndex}`] || null;
            }

            if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
                console.log(`orders fake of userId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
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
                            isTestPlayer: true,
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

            console.log(`userId ${userId} test player send event payment`);
            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {});
        }
        //await this.redisService.del(keyOrdersOfBookmaker);
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

    async createLotteryAwardInPastTime(turnIndex: string, seconds: number) {
        let gameType: any = [];
        switch (seconds) {
            case 45:
                gameType = [
                    TypeLottery.XSMB_45S,
                    TypeLottery.XSMT_45S,
                    TypeLottery.XSMN_45S,
                    TypeLottery.XSSPL_45S,
                ];
                break;

            case 60:
                gameType = [
                    TypeLottery.XSSPL_60S,
                ];
                break;

            case 90:
                gameType = [
                    TypeLottery.XSSPL_90S,
                ];
                break;

            case 120:
                gameType = [
                    TypeLottery.XSSPL_120S,
                ];
                break;

            case 180:
                gameType = [
                    TypeLottery.XSMB_180S,
                    TypeLottery.XSMT_180S,
                    TypeLottery.XSMN_180S,
                ];
                break;

            case 360:
                gameType = [
                    TypeLottery.XSSPL_360S,
                ];
                break;
        }

        const promises = [];
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const finalResult = this.lotteriesService.randomPrizes({});
                const lottery = await this.lotteryAwardService.findOneBy(type, turnIndex, bookMaker.id);
                if (lottery) continue;
                promises.push(
                    this.lotteryAwardService.createLotteryAward({
                        turnIndex,
                        type,
                        awardDetail: JSON.stringify(finalResult),
                        bookmaker: { id: bookMaker.id } as any,
                        isTestPlayer: false,
                    })
                )

                promises.push(
                    this.lotteryAwardService.createLotteryAward({
                        turnIndex,
                        type,
                        awardDetail: JSON.stringify(finalResult),
                        bookmaker: { id: bookMaker.id } as any,
                        isTestPlayer: true,
                    })
                )
            }
        }

        return promises;
    }
}