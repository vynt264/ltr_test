import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { addHours, startOfDay, addDays, addMinutes } from "date-fns";

import { LotteriesService } from 'src/components/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import { INIT_TIME_CREATE_JOB, MAINTENANCE_PERIOD, ORDER_STATUS, PERIOD_DELAY_TO_HANDLER_ORDERS, START_TIME_CREATE_JOB, TypeLottery } from 'src/system/constants';
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
        // create jobs current day
        await this.createJobs();
        // create jobs next day
        this.createJobsNextDay();
        await this.manageBonusPriceService.initBonusPrice(new Date());

        // create bonus price next day
        const currentDate = new Date();
        const nextDate = addDays(currentDate, 1);
        await this.manageBonusPriceService.initBonusPrice(nextDate);
    }

    async createJobs(startDate?: Date) {
        let awardsPromises: any = [];
        if (!startDate) {
            startDate = startOfDay(new Date());
        }
        this.logger.info("init job start");
        awardsPromises = awardsPromises.concat(this.createJobsInGame(45, startDate));
        awardsPromises = awardsPromises.concat(this.createJobsInGame(60, startDate));
        awardsPromises = awardsPromises.concat(this.createJobsInGame(90, startDate));
        awardsPromises = awardsPromises.concat(this.createJobsInGame(120, startDate));
        awardsPromises = awardsPromises.concat(this.createJobsInGame(180, startDate));
        awardsPromises = awardsPromises.concat(this.createJobsInGame(360, startDate));
        this.logger.info("init job finished");

        this.logger.info("create awards start");
        await Promise.all(awardsPromises);
        this.logger.info("create awards finished");
    }

    async createJobsNextDay() {
        const currentDate = new Date();
        let timeStartCreateJob = addHours(currentDate, 6);
        timeStartCreateJob = addMinutes(timeStartCreateJob, 40);
        if (currentDate > timeStartCreateJob) return;

        const nextDate = addDays(currentDate, 1);
        this.createJobs(startOfDay(nextDate));
    }

    async createJobsInGame(seconds: number, startDate: Date) {
        let timeMillisecondsStartRunJob = addHours(startDate, START_TIME_CREATE_JOB).getTime();
        const numberOfTurns = OrderHelper.getNumberOfTurnsInDay(seconds);
        let count = 0;
        let promises: any = [];
        for (let i = 0; i < numberOfTurns; i++) {
            timeMillisecondsStartRunJob = timeMillisecondsStartRunJob + (seconds * 1000);
            count++;
            const turn = OrderHelper.getFullCharOfTurn(count.toString());
            const turnIndex = `${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${turn}`;
            const nextTime = (timeMillisecondsStartRunJob + (seconds * 1000));
            if (timeMillisecondsStartRunJob > (new Date()).getTime()) {
                const jobName = `${seconds}-${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${turn}`;
                const nextTurn = OrderHelper.getFullCharOfTurn((count + 1).toString());
                const nextTurnIndex = `${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${nextTurn}`;
                this.addCronJob(jobName, seconds, timeMillisecondsStartRunJob, turnIndex, nextTurnIndex, nextTime);
            } else {
                const tempPromises = await this.createLotteryAwardInPastTime(turnIndex, seconds, timeMillisecondsStartRunJob, nextTime);
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

        // let data = await this.redisService.get(keyToGetOrders);
        // let dataOfTestPlayer = await this.redisService.get(keyToGetOrdersOfTestPlayer);

        // real users
        const keyToGetOrdersOfRealUser = OrderHelper.getKeyPrepareOrders(bookmakerId.toString(), gameType, turnIndex);
        const ordersReal = await this.redisService.hgetall(keyToGetOrdersOfRealUser);
        const keyCancelOrdersRealUsers = OrderHelper.getKeyCancelOrders(bookmakerId.toString(), gameType, turnIndex);
        const ordersCancelOfUserReal = await this.redisService.hgetall(keyCancelOrdersRealUsers);
        let dataReal = OrderHelper.splitOrders(ordersReal);
        dataReal = OrderHelper.cancelOrders(dataReal, ordersCancelOfUserReal);

        // test users
        const keyToGetOrdersOfTestPlayer = OrderHelper.getKeyPrepareOrdersOfTestPlayer(bookmakerId.toString(), gameType, turnIndex);
        const ordersTestPlayer = await this.redisService.hgetall(keyToGetOrdersOfTestPlayer);
        const keyCancelOrdersTestPlayer = OrderHelper.getKeyCancelOrdersOfTestPlayer(bookmakerId.toString(), gameType, turnIndex);
        const ordersCancelOfTestPlayer = await this.redisService.hgetall(keyCancelOrdersTestPlayer);
        let dataOfTestPlayer = OrderHelper.splitOrders(ordersTestPlayer);
        dataOfTestPlayer = OrderHelper.cancelOrders(dataOfTestPlayer, ordersCancelOfTestPlayer);

        await this.redisService.del(keyToGetOrdersOfRealUser);
        await this.redisService.del(keyToGetOrdersOfTestPlayer);

        if (!dataReal) {
            dataReal = {};
        }
        if (!dataOfTestPlayer) {
            dataOfTestPlayer = {};
        }

        // real users
        const dataTransform = OrderHelper.transformData(dataReal);
        const {
            prizes,
            totalRevenue,
            totalPayout,
            bonusPrice,
            totalProfit,
        } = await this.lotteriesService.handlerPrizes({
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
            createdAt: new Date(time),
            totalRevenue,
            totalPayout,
            bonusPrice,
            totalProfit,
        });
        const eventSendAwards = `${bookmakerId}-${gameType}-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwards, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
            isTestPlayer: false,
        });

        // calc balance
        this.handleBalance({
            turnIndex,
            prizes: finalResult,
            bookmakerId,
            gameType,
            isTestPlayer: false,
        });

        // fake users
        const dataTransformOfFakeUsers = OrderHelper.transformData(dataOfTestPlayer);
        const {
            prizes: prizesOfTestPlayer,
            totalRevenue: totalRevenueOfTestPlayer,
            totalPayout: totalPayoutOfTestPlayer,
            bonusPrice: bonusPriceOfTestPlayer,
            totalProfit: totalProfitOfTestPlayer,
        } = await this.lotteriesService.handlerPrizes({
            type: gameType,
            data: dataTransformOfFakeUsers,
            isTestPlayer: true,
        });
        const finalResultOfFakeUsers = OrderHelper.randomPrizes(prizesOfTestPlayer);
        this.lotteryAwardService.createLotteryAward({
            turnIndex,
            type: gameType,
            awardDetail: JSON.stringify(finalResultOfFakeUsers),
            bookmaker: { id: bookmakerId } as any,
            isTestPlayer: true,
            openTime: new Date(time),
            createdAt: new Date(time),
            totalRevenue: totalRevenueOfTestPlayer,
            totalPayout: totalPayoutOfTestPlayer,
            bonusPrice: bonusPriceOfTestPlayer,
            totalProfit: totalProfitOfTestPlayer,
        });
        const eventSendAwardsOfFakeUsers = `${bookmakerId}-${gameType}-test-player-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwardsOfFakeUsers, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResultOfFakeUsers,
            isTestPlayer: true,
        });
        // calc balance of fake users
        // this.handleBalanceIsTestPlayer({
        //     turnIndex,
        //     prizes: finalResultOfFakeUsers,
        //     bookmakerId,
        //     gameType,
        // });
        this.handleBalance({
            turnIndex,
            prizes: finalResult,
            bookmakerId,
            gameType,
            isTestPlayer: true,
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

    async deleteJobsBeforeDay() {
        this.logger.info("delete all job.");
        const jobs = this.schedulerRegistry.getCronJobs();
        const year = (new Date()).getFullYear();
        let month = (((new Date()).getMonth()) + 1).toString();
        if (month.length === 1) {
            month = `0${month}`;
        }
        let day = (new Date()).getDate().toString();
        if (day.length === 1) {
            day = `0${day}`;
        }
        const dateCurrentString = `${year}${month}${day}`;

        jobs.forEach((value, key, map) => {
            const regex = `10-${dateCurrentString}|45-${dateCurrentString}|60-${dateCurrentString}|90-${dateCurrentString}|120-${dateCurrentString}|180-${dateCurrentString}|360-${dateCurrentString}`
            const dateString = key.split('-')[1] || '';
            if (
                new RegExp(regex).test(key)
                && dateString !== dateCurrentString
            ) {
                this.schedulerRegistry.deleteCronJob(key);
            }
        });
    }

    @Cron('40 6 * * * ')
    async cronJob() {
        this.logger.info("cron job.");
        await this.clearDataInRedis();
        await this.createJobsNextDay();

        // create bonus price next day
        const currentDate = new Date();
        const nextDate = addDays(currentDate, 1);
        await this.manageBonusPriceService.initBonusPrice(nextDate);
    }

    @Cron('10 00 * * *')
    deleteJobs() {
        this.deleteJobsBeforeDay();
    }

    async handleBalance({
        turnIndex,
        prizes,
        bookmakerId,
        gameType,
        isTestPlayer,
    }: {
        turnIndex: string,
        prizes: any,
        bookmakerId: number,
        gameType: string,
        isTestPlayer: boolean,
    }) {
        // get all userId of bookmaker
        let keyGetUserIds = OrderHelper.getKeySaveUserIdsByBookmaker(bookmakerId.toString());
        if (isTestPlayer) {
            keyGetUserIds = OrderHelper.getKeySaveUserIdsFakeByBookmaker(bookmakerId.toString());
        }
        let userIds: any = await this.redisService.hgetall(keyGetUserIds);
        userIds = OrderHelper.getUserIdsOfBookmaker(userIds);
        if (!userIds) return;

        // get orders of bookmaker by game type (example: sxmb45s)
        let keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), gameType);
        if (isTestPlayer) {
            keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), gameType);
        }

        const winningPlayerOrders = []; // order users thang cuoc.
        for (const userId of userIds) {
            const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), turnIndex);
            const mergeKey = `${keyOrdersOfBookmakerAndGameType}-${keyByUserAndTurnIndex}`;
            const ordersOfUser = await this.redisService.hgetall(mergeKey);

            if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
                this.logger.info(`orders of userId ${keyOrdersOfBookmakerAndGameType}-${turnIndex} is not found.`);
                continue;
            }

            const ordersCancel = await this.redisService.hgetall(`${mergeKey}-cancel-orders`);
            const promises = [];
            const promisesCreateWinningNumbers = [];
            const ordersWin = [];
            let totalBalance = 0;
            for (const key in ordersOfUser) {
                if (ordersCancel[key] && Object.keys(ordersCancel[key]).length > 0) continue;

                const [orderId, region, betType, childBetType] = key.split('-');
                const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
                    orders: JSON.parse(ordersOfUser[key]),
                    childBetType,
                    prizes,
                });

                totalBalance += winningAmount;

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

                if (winningNumbers.length > 0) {
                    promisesCreateWinningNumbers.push(
                        this.winningNumbersService.create({
                            winningNumbers: JSON.stringify(winningNumbers),
                            turnIndex,
                            order: {
                                id: orderId
                            } as any,
                            type: gameType,
                            isTestPlayer,
                        }),
                    );
                }

                promises.push(this.ordersService.update(
                    +orderId,
                    {
                        paymentWin: realWinningAmount,
                        status: ORDER_STATUS.closed,
                    },
                    null,
                ));
            }

            // save winning numbers
            Promise.all(promisesCreateWinningNumbers);
            await Promise.all(promises);

            // check nuoi so
            const { refunds } = await this.handlerHoldingNumbers({
                winningPlayerOrders,
                bookmakerId,
                userId,
                usernameReal: isTestPlayer ? true : false,
            });

            const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
            const remainBalance = +wallet.balance + totalBalance + refunds;
            await this.walletHandlerService.updateWalletByUserId(+userId, { balance: remainBalance });


            if ((totalBalance + refunds) > 0) {
                // save wallet history
                const createWalletHis: any = {
                    id: wallet.id,
                    user: { id: Number(userId) },
                    subOrAdd: 1,
                    amount: totalBalance + refunds,
                    detail: `Xổ số nhanh - Cộng tiền thắng`,
                    balance: remainBalance,
                    createdBy: ""
                }

                const createdWalletHis = await this.walletHistoryRepository.create(createWalletHis);
                await this.walletHistoryRepository.save(createdWalletHis);
            }

            if (isTestPlayer) {
                this.logger.info(`userId ${userId} test player send event payment`);
            } else {
                this.logger.info(`userId ${userId} send event payment`);
            }
            this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {
                ordersWin,
            });
        }
    }

    async handlerHoldingNumbers({
        winningPlayerOrders,
        bookmakerId,
        userId,
        usernameReal,
    }: any) {
        let refunds = 0;

        if (!winningPlayerOrders || winningPlayerOrders.length === 0) return {
            refunds,
        };

        const promises = [];
        for (const orderId of winningPlayerOrders) {
            const order = await this.ordersService.findOne(+orderId);
            if (!order?.holdingNumber?.id) continue;

            const holdingNumber = await this.holdingNumbersService.findOne(+order.holdingNumber.id);

            if (!holdingNumber.isStop) continue;

            const orders = await this.ordersService.findOrdersByHoldingNumberId(holdingNumber.id);

            if (!orders || orders.length === 0) continue;

            // remove orders
            for (const order of orders) {
                const tempOrder = await this.ordersService.findOne(order.id);
                if (tempOrder.status === ORDER_STATUS.canceled || tempOrder.status === ORDER_STATUS.closed) continue;

                refunds += Number(tempOrder.revenue);

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

        return {
            refunds,
        }
    }

    // async handleBalanceIsTestPlayer({
    //     turnIndex,
    //     prizes,
    //     bookmakerId,
    //     gameType,
    // }: {
    //     turnIndex: string,
    //     prizes: any,
    //     bookmakerId: number,
    //     gameType: string,
    // }) {

    //     // get all userId of bookmaker
    //     const keyGetUserIds = OrderHelper.getKeySaveUserIdsFakeByBookmaker(bookmakerId.toString());
    //     let userIds: any = await this.redisService.hgetall(keyGetUserIds);
    //     userIds = OrderHelper.getUserIdsOfBookmaker(userIds);
    //     if (!userIds) return;

    //     // get orders of bookmaker by game type (example: sxmb45s)
    //     const keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), gameType);
    //     const winningPlayerOrders = []; // order users thang cuoc.

    //     for (const userId of userIds) {
    //         const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), turnIndex);
    //         const mergeKey = `${keyOrdersOfBookmaker}-${keyByUserAndTurnIndex}`;
    //         const ordersOfUser = await this.redisService.hgetall(mergeKey);

    //         if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
    //             this.logger.info(`orders fake of userId ${keyOrdersOfBookmaker}-${turnIndex} is not found.`);
    //             continue;
    //         }

    //         const ordersCancel = await this.redisService.hgetall(`${mergeKey}-cancel-orders`);
    //         const promises = [];
    //         let totalBalance = 0;
    //         const promisesCreateWinningNumbers = [];
    //         const ordersWin = [];
    //         for (const key in ordersOfUser) {
    //             if (ordersCancel[key] && Object.keys(ordersCancel[key]).length > 0) continue;

    //             const [orderId, region, betType, childBetType] = key.split('-');
    //             const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
    //                 orders: JSON.parse(ordersOfUser[key]),
    //                 childBetType,
    //                 prizes,
    //             });

    //             totalBalance += winningAmount;

    //             // user win vs order hien tai
    //             if (realWinningAmount > 0) {
    //                 winningPlayerOrders.push(orderId);
    //                 ordersWin.push({
    //                     typeBetName: OrderHelper.getCategoryLotteryTypeName(betType),
    //                     childBetType: OrderHelper.getChildBetTypeName(childBetType),
    //                     orderId,
    //                     type: region,
    //                     amount: realWinningAmount,
    //                 });
    //             }

    //             if (winningNumbers.length > 0) {
    //                 promisesCreateWinningNumbers.push(
    //                     this.winningNumbersService.create({
    //                         winningNumbers: JSON.stringify(winningNumbers),
    //                         turnIndex,
    //                         order: {
    //                             id: orderId
    //                         } as any,
    //                         type: gameType,
    //                         isTestPlayer: true,
    //                     }),
    //                 );
    //             }

    //             promises.push(this.ordersService.update(
    //                 +orderId,
    //                 {
    //                     paymentWin: realWinningAmount,
    //                     status: ORDER_STATUS.closed,
    //                 },
    //                 null,
    //             ));
    //         }

    //         // save winning numbers
    //         Promise.all(promisesCreateWinningNumbers);
    //         await Promise.all(promises);

    //         // check nuoi so
    //         const { refunds } = await this.handlerHoldingNumbers({
    //             winningPlayerOrders,
    //             bookmakerId,
    //             userId,
    //             usernameReal: true,
    //         });

    //         const wallet = await this.walletHandlerService.findWalletByUserId(+userId);
    //         const remainBalance = +wallet.balance + totalBalance + refunds;
    //         await this.walletHandlerService.updateWalletByUserId(+userId, { balance: remainBalance });

    //         this.logger.info(`userId ${userId} test player send event payment`);
    //         this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {
    //             ordersWin,
    //         });
    //     }
    // }

    async clearDataInRedis() {
        this.logger.info(`clear data in redis.`);
        const bookMakers = await this.bookMakerService.getAllBookMaker();
        const typeLottery = Object.values(TypeLottery);
        const promises = [];
        for (const bookMaker of bookMakers) {
            for (const key in typeLottery) {
                const keyOrdersOfBookmaker = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookMaker.id, typeLottery[key]);
                const keyOrdersOfBookmakerIsTestPlayer = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookMaker.id, typeLottery[key]);
                // const keyToGetOrders = OrderHelper.getKeyPrepareOrders();
                promises.push(this.redisService.del(keyOrdersOfBookmaker));
                promises.push(this.redisService.del(keyOrdersOfBookmakerIsTestPlayer));
                // delete key prepare orders
                // promises.push(this.redisService.del(`${bookMaker.id}-${typeLottery[key]}`));
            }
        }

        await Promise.all(promises);
    }

    async createLotteryAwardInPastTime(turnIndex: string, seconds: number, openTime: number, nextTime: number) {
        let gameType: any = OrderHelper.getGameTypesBySeconds(seconds);
        const promises = [];
        const bookMakers = await this.bookMakerService.getAllBookMaker();

        for (const bookMaker of bookMakers) {
            for (const type of gameType) {
                const finalResult = OrderHelper.randomPrizes({});
                const lotteryReal = await this.lotteryAwardService.findOneBy(type, turnIndex, bookMaker.id, false);
                if (!lotteryReal) {
                    promises.push(
                        this.lotteryAwardService.createLotteryAward({
                            turnIndex,
                            type,
                            awardDetail: JSON.stringify(finalResult),
                            bookmaker: { id: bookMaker.id } as any,
                            isTestPlayer: false,
                            openTime: new Date(openTime),
                            createdAt: new Date(openTime),
                            totalRevenue: 0,
                            totalPayout: 0,
                            bonusPrice: 0,
                            totalProfit: 0,
                        })
                    )
                }
                const lotteryTestPlayer = await this.lotteryAwardService.findOneBy(type, turnIndex, bookMaker.id, true);

                if (!lotteryTestPlayer) {
                    promises.push(
                        this.lotteryAwardService.createLotteryAward({
                            turnIndex,
                            type,
                            awardDetail: JSON.stringify(finalResult),
                            bookmaker: { id: bookMaker.id } as any,
                            isTestPlayer: true,
                            openTime: new Date(openTime),
                            createdAt: new Date(openTime),
                            totalRevenue: 0,
                            totalPayout: 0,
                            bonusPrice: 0,
                            totalProfit: 0,
                        })
                    )
                }
            }
        }

        return promises;
    }
}