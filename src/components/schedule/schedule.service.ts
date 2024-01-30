import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';

import { LotteriesService } from 'src/components/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import { INIT_TIME_CREATE_JOB, MAINTENANCE_PERIOD, PERIOD_DELAY_TO_HANDLER_ORDERS, TypeLottery } from 'src/system/constants';
import { OrdersService } from '../orders/orders.service';
import { WalletHandlerService } from '../wallet-handler/wallet-handler.service';
import { LotteryAwardService } from '../lottery.award/lottery.award.service';
import { DateTimeHelper } from 'src/helpers/date-time';
import { WinningNumbersService } from '../winning-numbers/winning-numbers.service';
import { OrderHelper } from 'src/common/helper';
import { HoldingNumbersService } from '../holding-numbers/holding-numbers.service';
import { WalletHistory } from '../wallet/wallet.history.entity';
import { Logger } from 'winston';
import { ManageBonusPriceService } from '../manage-bonus-price/manage-bonus-price.service';

@Injectable()
export class ScheduleService implements OnModuleInit {
    constructor(
        @InjectRepository(WalletHistory)
        private walletHistoryRepository: Repository<WalletHistory>,
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
        private readonly manageBonusPriceService: ManageBonusPriceService,
        @Inject("winston")
        private readonly logger: Logger
    ) { }

    async onModuleInit() {
        this.logger.info("==============================init schedule==============================");
        await this.init();
        this.logger.info("==============================finish schedule==============================");
    }

    async init() {
        let promises: any = [];
        await this.clearDataInRedis();
        await this.deleteAllJobCountDown();
        this.logger.info("init job start");
        promises = promises.concat(this.createJobs(45));
        promises = promises.concat(this.createJobs(60));
        promises = promises.concat(this.createJobs(90));
        promises = promises.concat(this.createJobs(120));
        promises = promises.concat(this.createJobs(180));
        promises = promises.concat(this.createJobs(360));
        this.logger.info("init job finished");

        this.logger.info("create awards start");

        await Promise.all(promises);
        this.logger.info("create awards finished");

        await this.manageBonusPriceService.initBonusPrice();
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
                const tempPromises = await this.createLotteryAwardInPastTime(turnIndex, seconds, timeMillisecondsStartRunJob);
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
        let gameType = OrderHelper.getGameTypesBySeconds(seconds);
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        let promises = [];
        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, type, bookMaker.id));
            }
        }

        await Promise.all(promises);

        this.finishJob(jobName, time);
    }

    async processingData(time: number, turnIndex: string, nextTurnIndex: string, nextTime: number, gameType: string, bookmakerId: number) {
        // event reload tao ke hoach theo doi so
        this.socketGateway.sendEventToClient(`${bookmakerId}-${gameType}-reload-list-tracked-number`, {
            turnIndex,
            nextTurnIndex,
        });

        const keyToGetOrders = OrderHelper.getKeyPrepareOrders(bookmakerId.toString(), gameType, turnIndex);
        const keyToGetOrdersOfTestPlayer = OrderHelper.getKeyPrepareOrdersOfTestPlayer(bookmakerId.toString(), gameType, turnIndex);
        let data = await this.redisService.get(keyToGetOrders);
        let dataOfTestPlayer = await this.redisService.get(keyToGetOrdersOfTestPlayer);
        await this.redisService.del(keyToGetOrders);
        if (!data) {
            data = {};
        }
        if (!dataOfTestPlayer) {
            dataOfTestPlayer = {};
        }

        // real users
        const dataTransform = OrderHelper.transformData(data);
        const prizes = await this.lotteriesService.handlerPrizes({
            type: gameType,
            data: dataTransform,
            isTestPlayer: false,
        });

        const finalResult = OrderHelper.randomPrizes(prizes);
        this.lotteryAwardService.createLotteryAward({
            turnIndex,
            type: gameType,
            awardDetail: JSON.stringify(finalResult),
            bookmaker: { id: bookmakerId } as any,
            isTestPlayer: false,
            openTime: new Date(time),
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
        const dataTransformOfFakeUsers = OrderHelper.transformData(dataOfTestPlayer);
        // const prizesOfFakeUsers = this.lotteriesService.generatePrizes(dataTransformOfFakeUsers);
        const prizesOfFakeUsers = await this.lotteriesService.handlerPrizes({
            type: gameType,
            data: dataTransformOfFakeUsers,
            isTestPlayer: true,
        });
        const finalResultOfFakeUsers = OrderHelper.randomPrizes(prizesOfFakeUsers);
        this.lotteryAwardService.createLotteryAward({
            turnIndex,
            type: gameType,
            awardDetail: JSON.stringify(finalResultOfFakeUsers),
            bookmaker: { id: bookmakerId } as any,
            isTestPlayer: true,
            openTime: new Date(time),
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

    deleteCron(name: string) {
        this.schedulerRegistry.deleteCronJob(name);
        this.logger.info(`job ${name} deleted!`);
    }

    startJob(name: string) {
        this.logger.info(`job ${name} started!`);
    }

    finishJob(name: string, time: number) {
        this.logger.info(`job ${name} finished at ${(new Date(time)).toLocaleTimeString()}`);
    }

    async deleteAllJobCountDown() {
        this.logger.info("delete all job.");
        const jobs = this.schedulerRegistry.getCronJobs();
        jobs.forEach((value, key, map) => {
            const regex = `10-${(new Date()).getFullYear()}|45-${(new Date()).getFullYear()}|60-${(new Date()).getFullYear()}|90-${(new Date()).getFullYear()}|120-${(new Date()).getFullYear()}|180-${(new Date()).getFullYear()}|360-${(new Date()).getFullYear()}`
            if (new RegExp(regex).test(key)) {
                this.schedulerRegistry.deleteCronJob(key);
            }
        });
    }

    @Cron('40 6 * * * ')
    cronJob() {
        this.logger.info("cron job.");
        this.init();
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
        const keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), gameType);
        const ordersOfBookmakerAndGameType: any = await this.redisService.get(keyOrdersOfBookmakerAndGameType);
        if (!ordersOfBookmakerAndGameType || Object.keys(ordersOfBookmakerAndGameType).length === 0) {
            this.logger.info(`orders of bookmakerId ${keyOrdersOfBookmakerAndGameType}-${turnIndex} is not found.`);
            return;
        }

        const winningPlayerOrders = []; // order users thang cuoc.

        for (const userId of userIds) {
            const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), turnIndex);
            let ordersOfUser;
            if (userId) {
                ordersOfUser = ordersOfBookmakerAndGameType?.[keyByUserAndTurnIndex] || null;
            }

            if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
                this.logger.info(`orders of userId ${keyOrdersOfBookmakerAndGameType}-${turnIndex} is not found.`);
                continue;
            }

            const promises = [];
            let totalBalance = 0;
            const promisesCreateWinningNumbers = [];
            const ordersWin = [];
            for (const key in ordersOfUser) {
                const [orderId, region, betType, childBetType] = key.split('-');
                const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
                    orders: ordersOfUser[key],
                    childBetType,
                    prizes,
                });

                // user win vs order hien tai
                if (realWinningAmount > 0) {
                    winningPlayerOrders.push(orderId);
                    ordersWin.push({
                        typeBetName: OrderHelper.getCategoryLotteryTypeName(betType),
                        childBetType: OrderHelper.getChildBetTypeName(childBetType),
                        orderId,
                        type: region,
                        amount: realWinningAmount,
                    });
                }

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

            // save wallet history
            const createWalletHis: any = {
                id: wallet.id,
                user: { id: userId },
                balance: remainBalance,
                createdBy: ""
            }
            const createdWalletHis = await this.walletHistoryRepository.create(createWalletHis);
            await this.walletHistoryRepository.save(createdWalletHis);

            this.logger.info(`userId ${userId} send event payment`);
            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {
                ordersWin,
            });
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

            if (!orders || orders.length === 0) return;

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
            this.logger.info(`orders fake of bookmakerId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
            return;
        }

        const winningPlayerOrders = []; // order users thang cuoc.

        for (const userId of userIds) {
            let ordersOfUser;
            if (userId) {
                ordersOfUser = ordersOfBookmaker?.[`user-id-${userId}-${turnIndex}`] || null;
            }

            if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
                this.logger.info(`orders fake of userId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
                continue;
            }

            const promises = [];
            let totalBalance = 0;
            const promisesCreateWinningNumbers = [];
            for (const key in ordersOfUser) {
                const [orderId, region, typeBet] = key.split('-');
                const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
                    orders: ordersOfUser[key],
                    typeBet,
                    prizes,
                });

                totalBalance += winningAmount;

                // user win vs order hien tai
                if (realWinningAmount > 0) {
                    winningPlayerOrders.push(orderId);
                }

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

            // check nuoi so
            this.handlerHoldingNumbers({
                winningPlayerOrders,
                bookmakerId,
                userId,
                usernameReal: true,
            });

            const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
            const remainBalance = +wallet.balance + totalBalance;
            await this.walletHandlerService.updateWalletByUserId(+userId, { balance: remainBalance });

            this.logger.info(`userId ${userId} test player send event payment`);
            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {});
        }
        //await this.redisService.del(keyOrdersOfBookmaker);
    }

    async clearDataInRedis() {
        this.logger.info(`clear data in redis.`);
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

    async createLotteryAwardInPastTime(turnIndex: string, seconds: number, openTime: number) {
        let gameType: any = OrderHelper.getGameTypesBySeconds(seconds);
        const promises = [];
        const bookMakers = await this.bookMakerService.getAllBookMaker();

        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const finalResult = OrderHelper.randomPrizes({});
                const lottery = await this.lotteryAwardService.findOneBy(type, turnIndex, bookMaker.id);
                if (lottery) continue;
                promises.push(
                    this.lotteryAwardService.createLotteryAward({
                        turnIndex,
                        type,
                        awardDetail: JSON.stringify(finalResult),
                        bookmaker: { id: bookMaker.id } as any,
                        isTestPlayer: false,
                        openTime: new Date(openTime),
                    })
                )

                promises.push(
                    this.lotteryAwardService.createLotteryAward({
                        turnIndex,
                        type,
                        awardDetail: JSON.stringify(finalResult),
                        bookmaker: { id: bookMaker.id } as any,
                        isTestPlayer: true,
                        openTime: new Date(openTime),
                    })
                )
            }
        }

        return promises;
    }
}