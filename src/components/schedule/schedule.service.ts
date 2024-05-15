import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob } from 'cron';
import { addHours, startOfDay, addDays, addMinutes } from "date-fns";
import { LotteriesService } from 'src/components/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { BookMakerService } from '../bookmaker/bookmaker.service';
import {
    MAINTENANCE_PERIOD,
    ORDER_STATUS,
    PERIOD_DELAY_TO_HANDLER_ORDERS,
    START_TIME_CREATE_JOB,
    TypeLottery,
} from 'src/system/constants';
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
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ScheduleService implements OnModuleInit {
    constructor(
        @Inject(forwardRef(() => SettingsService))
        private settingsService: SettingsService,

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
        try {
            const currentDate = new Date();
            const nextDate = addDays(currentDate, 1);

            // delete job current day
            await this.deleteJobs(currentDate);

            // delete job before day
            await this.deleteJobs(nextDate);

            // create jobs current day
            await this.createJobs();

            // create jobs next day
            await this.createJobsNextDay();

            // create bonus current day
            await this.manageBonusPriceService.initBonusPrice(currentDate);

            // create bonus next day
            await this.manageBonusPriceService.initBonusPrice(nextDate);

            // delete job reset bonus current date
            await this.deleteJobResetBonus(currentDate);

            // delete job reset bonus next date
            await this.deleteJobResetBonus(nextDate);

            // create job reset bonus current date
            await this.generateJobResetBonus(currentDate);

            // create job reset bonus next date
            await this.generateJobResetBonus(nextDate);
        } catch (err) {
            this.logger.error(err.stack);
        }
    }

    async createJobs(startDate?: Date) {
        let awardsPromises: any = [];
        if (!startDate) {
            startDate = startOfDay(new Date());
        }

        this.logger.info(`init job start - ${new Date(startDate).toLocaleDateString()}`);
        const promises45s = await this.createJobsInGame(45, startDate);
        awardsPromises = awardsPromises.concat(promises45s);
        const promises60s = await this.createJobsInGame(60, startDate);
        awardsPromises = awardsPromises.concat(promises60s);
        const promises90s = await this.createJobsInGame(90, startDate);
        awardsPromises = awardsPromises.concat(promises90s);
        const promises120s = await this.createJobsInGame(120, startDate);
        awardsPromises = awardsPromises.concat(promises120s);
        const promises180s = await this.createJobsInGame(180, startDate);
        awardsPromises = awardsPromises.concat(promises180s);
        const promises360s = await this.createJobsInGame(360, startDate);
        awardsPromises = awardsPromises.concat(promises360s);
        this.logger.info(`init job finished - ${new Date(startDate).toLocaleDateString()}`);

        this.logger.info(`create awards start - ${new Date(startDate).toLocaleDateString()}`);
        await Promise.all(awardsPromises);
        this.logger.info(`create awards finished - ${new Date(startDate).toLocaleDateString()}`);
    }

    async createJobsNextDay() {
        const currentDate = new Date();
        const nextDate = addDays(currentDate, 1);
        this.createJobs(startOfDay(nextDate));
    }

    async createJobsInGame(seconds: number, startDate: Date) {
        const dateString = DateTimeHelper.formatDate(startDate);
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
                const jobName = `${seconds}-${dateString}-${turn}`;
                const nextTurn = OrderHelper.getFullCharOfTurn((count + 1).toString());
                const nextTurnIndex = `${DateTimeHelper.formatDate((new Date(timeMillisecondsStartRunJob)))}-${nextTurn}`;
                this.addCronJob(jobName, seconds, timeMillisecondsStartRunJob, turnIndex, nextTurnIndex, nextTime);
            } else {
                const tempPromises = await this.createLotteryAwardInPastTime(turnIndex, seconds, timeMillisecondsStartRunJob, nextTime);
                if (tempPromises.length > 0) {
                    promises = promises.concat(tempPromises);
                }
            }
        }

        return promises;
    }

    addCronJob(name: string, seconds: number, time: any, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        const job = new CronJob(new Date((time)), () => {
            this.callbackFunc(name, seconds, time, turnIndex, nextTurnIndex, nextTime);
        });
        try {
            this.schedulerRegistry.addCronJob(name, job);
        } catch (err) {
            console.log(err);
        }
        job.start();
    }

    async callbackFunc(jobName: string, seconds: number, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        await OrderHelper.delay(PERIOD_DELAY_TO_HANDLER_ORDERS);
        this.handlerJobs(jobName, time, turnIndex, nextTurnIndex, nextTime, seconds);
    }

    async handlerJobs(jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number, seconds: number) {
        try {
            let gameType = OrderHelper.getGameTypesBySeconds(seconds);
            const bookMakers = await this.bookMakerService.getAllBookMaker();
            let promises = [];
            for (const type of gameType) {
                promises.push(this.processingData(time, turnIndex, nextTurnIndex, nextTime, type, bookMakers));
            }

            await Promise.all(promises);
        } catch (err) {
            this.logger.error(err.stack);
        }
    }

    async processingData(time: number, turnIndex: string, nextTurnIndex: string, nextTime: number, gameType: string, bookMakers: any) {
        // event reload tao ke hoach theo doi so
        this.socketGateway.sendEventToClient(`${gameType}-reload-list-tracked-number`, {
            turnIndex,
            nextTurnIndex,
        });

        // return this.handleOrders({
        //     time,
        //     turnIndex,
        //     nextTurnIndex,
        //     nextTime,
        //     gameType,
        //     bookMakers,
        // });

        // real player
        this.handleDataRealPlayer({
            time,
            turnIndex,
            nextTurnIndex,
            nextTime,
            gameType,
            bookMakers,
        });

        // test player
        this.handleDataTestPlayer({
            time,
            turnIndex,
            nextTurnIndex,
            nextTime,
            gameType,
            bookMakers,
        });
    }

    async getAwards({
        gameType,
        turnIndex,
        isTestPlayer = false,
    }: {
        gameType: string,
        turnIndex: string,
        isTestPlayer: boolean,
    }) {
        const keyToGetOrdersOfRealUser = OrderHelper.getKeyPrepareOrders(null, gameType, turnIndex);
        const ordersReal = await this.redisService.hgetall(keyToGetOrdersOfRealUser);
        const keyCancelOrdersRealUsers = OrderHelper.getKeyCancelOrders(null, gameType, turnIndex);
        const ordersCancelOfUserReal = await this.redisService.hgetall(keyCancelOrdersRealUsers);
        let dataReal = OrderHelper.splitOrders(ordersReal);
        dataReal = OrderHelper.cancelOrders(dataReal, ordersCancelOfUserReal);
        this.redisService.del(keyToGetOrdersOfRealUser);
        this.redisService.del(keyCancelOrdersRealUsers);

        if (!dataReal) {
            dataReal = {};
        }

        const dataTransform = OrderHelper.transformData(dataReal);
        const {
            finalResult,
            totalRevenue,
            totalPayout,
            bonusPrice,
            totalProfit,
        } = await this.lotteriesService.handlerPrizes({
            turnIndex,
            isTestPlayer,
            type: gameType,
            data: dataTransform,
        });

        return {
            finalResult,
            totalRevenue,
            totalPayout,
            bonusPrice,
            totalProfit,
        };
    }

    async handleDataRealPlayer({
        gameType,
        turnIndex,
        time,
        nextTurnIndex,
        nextTime,
        bookMakers,
    }: {
        gameType: string,
        turnIndex: string,
        time: number,
        nextTurnIndex: string,
        nextTime: number,
        bookMakers: any,
    }) {
        // real player
        const keyToGetOrdersOfRealUser = OrderHelper.getKeyPrepareOrders(null, gameType, turnIndex);
        const ordersReal = await this.redisService.hgetall(keyToGetOrdersOfRealUser);
        const keyCancelOrdersRealUsers = OrderHelper.getKeyCancelOrders(null, gameType, turnIndex);
        const ordersCancelOfUserReal = await this.redisService.hgetall(keyCancelOrdersRealUsers);
        let dataReal = OrderHelper.splitOrders(ordersReal);
        dataReal = OrderHelper.cancelOrders(dataReal, ordersCancelOfUserReal);
        this.redisService.del(keyToGetOrdersOfRealUser);
        this.redisService.del(keyCancelOrdersRealUsers);

        if (!dataReal) {
            dataReal = {};
        }

        const dataTransform = OrderHelper.transformData(dataReal);
        const {
            finalResult,
            totalRevenue,
            totalPayout,
            bonusPrice,
            totalProfit,
        } = await this.lotteriesService.handlerPrizes({
            turnIndex,
            type: gameType,
            data: dataTransform,
            isTestPlayer: false,
        });
        const eventSendAwards = `${gameType}-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwards, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
            isTestPlayer: false,
        });

        for (const bookMaker of bookMakers) {
            this.lotteryAwardService.createLotteryAward({
                turnIndex,
                type: gameType,
                awardDetail: JSON.stringify(finalResult),
                bookmaker: { id: bookMaker.id } as any,
                isTestPlayer: false,
                openTime: new Date(time),
                createdAt: new Date(time),
                totalRevenue,
                totalPayout,
                bonusPrice,
                totalProfit,
            });

            this.handleBalance({
                turnIndex,
                prizes: finalResult,
                bookmakerId: bookMaker.id,
                gameType,
                isTestPlayer: false,
            });
        }
    }

    async handleDataTestPlayer({
        gameType,
        turnIndex,
        time,
        nextTurnIndex,
        nextTime,
        bookMakers,
    }: {
        gameType: string,
        turnIndex: string,
        time: number,
        nextTurnIndex: string,
        nextTime: number,
        bookMakers: any,
    }) {
        const keyToGetOrdersOfTestPlayer = OrderHelper.getKeyPrepareOrdersOfTestPlayer(null, gameType, turnIndex);
        const ordersTestPlayer = await this.redisService.hgetall(keyToGetOrdersOfTestPlayer);
        const keyCancelOrdersTestPlayer = OrderHelper.getKeyCancelOrdersOfTestPlayer(null, gameType, turnIndex);
        const ordersCancelOfTestPlayer = await this.redisService.hgetall(keyCancelOrdersTestPlayer);
        let dataOfTestPlayer = OrderHelper.splitOrders(ordersTestPlayer);
        dataOfTestPlayer = OrderHelper.cancelOrders(dataOfTestPlayer, ordersCancelOfTestPlayer);
        this.redisService.del(keyToGetOrdersOfTestPlayer);
        this.redisService.del(keyCancelOrdersTestPlayer);

        if (!dataOfTestPlayer) {
            dataOfTestPlayer = {};
        }

        const dataTransformOfFakeUsers = OrderHelper.transformData(dataOfTestPlayer);
        const {
            finalResult: finalResultOfFakeUsers,
            prizes: prizesOfTestPlayer,
            totalRevenue: totalRevenueOfTestPlayer,
            totalPayout: totalPayoutOfTestPlayer,
            bonusPrice: bonusPriceOfTestPlayer,
            totalProfit: totalProfitOfTestPlayer,
        } = await this.lotteriesService.handlerPrizes({
            turnIndex,
            type: gameType,
            data: dataTransformOfFakeUsers,
            isTestPlayer: true,
        });
        // const finalResultOfFakeUsers = OrderHelper.randomPrizes(prizesOfTestPlayer);
        const eventSendAwardsOfFakeUsers = `${gameType}-test-player-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwardsOfFakeUsers, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResultOfFakeUsers,
            isTestPlayer: true,
        });
        for (const bookMaker of bookMakers) {
            this.lotteryAwardService.createLotteryAward({
                turnIndex,
                type: gameType,
                awardDetail: JSON.stringify(finalResultOfFakeUsers),
                bookmaker: { id: bookMaker.id } as any,
                isTestPlayer: true,
                openTime: new Date(time),
                createdAt: new Date(time),
                totalRevenue: totalRevenueOfTestPlayer,
                totalPayout: totalPayoutOfTestPlayer,
                bonusPrice: bonusPriceOfTestPlayer,
                totalProfit: totalProfitOfTestPlayer,
            });
            this.handleBalance({
                turnIndex,
                prizes: finalResultOfFakeUsers,
                bookmakerId: bookMaker.id,
                gameType,
                isTestPlayer: true,
            });
        }
    }

    async handleOrders({
        gameType,
        turnIndex,
        time,
        nextTurnIndex,
        nextTime,
        bookMakers,
    }: {
        gameType: string,
        turnIndex: string,
        time: number,
        nextTurnIndex: string,
        nextTime: number,
        bookMakers: any,
    }) {
        const {
            finalResult,
            totalRevenue,
            totalPayout,
            bonusPrice,
            totalProfit,
        } = await this.getAwards({
            gameType,
            turnIndex,
            isTestPlayer: false,
        });

        // real player
        const eventSendAwards = `${gameType}-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwards, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
            isTestPlayer: false,
        });

        // test player
        const eventSendAwardsOfFakeUsers = `${gameType}-test-player-receive-prizes`;
        this.socketGateway.sendEventToClient(eventSendAwardsOfFakeUsers, {
            type: gameType,
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
            isTestPlayer: true,
        });

        const promises = [];
        for (const bookMaker of bookMakers) {
            // real player
            promises.push(this.lotteryAwardService.createLotteryAward({
                turnIndex,
                type: gameType,
                awardDetail: JSON.stringify(finalResult),
                bookmaker: { id: bookMaker.id } as any,
                isTestPlayer: false,
                openTime: new Date(time),
                createdAt: new Date(time),
                totalRevenue,
                totalPayout,
                bonusPrice,
                totalProfit,
            }));
            promises.push(this.handleBalance({
                turnIndex,
                prizes: finalResult,
                bookmakerId: bookMaker.id,
                gameType,
                isTestPlayer: false,
            }));

            // test player
            promises.push(this.lotteryAwardService.createLotteryAward({
                turnIndex,
                type: gameType,
                awardDetail: JSON.stringify(finalResult),
                bookmaker: { id: bookMaker.id } as any,
                isTestPlayer: true,
                openTime: new Date(time),
                createdAt: new Date(time),
                totalRevenue: 0,
                totalPayout: 0,
                bonusPrice: 0,
                totalProfit: 0,
            }));
            promises.push(this.handleBalance({
                turnIndex,
                prizes: finalResult,
                bookmakerId: bookMaker.id,
                gameType,
                isTestPlayer: true,
            }));
        }

        await Promise.all(promises);
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

    async deleteJobs(date: Date) {
        if (!date) return;

        this.logger.info(`delete job - ${new Date(date).toLocaleDateString()}`);
        const jobs = this.schedulerRegistry.getCronJobs();
        const year = (date).getFullYear();
        let month = (((date).getMonth()) + 1).toString();
        if (month.length === 1) {
            month = `0${month}`;
        }
        let day = (date).getDate().toString();
        if (day.length === 1) {
            day = `0${day}`;
        }
        const dateCurrentString = `${year}${month}${day}`;

        jobs.forEach((value, key, map) => {
            const regex = `10-${dateCurrentString}|45-${dateCurrentString}|60-${dateCurrentString}|90-${dateCurrentString}|120-${dateCurrentString}|180-${dateCurrentString}|360-${dateCurrentString}`
            const dateString = key.split('-')[1] || '';
            if (
                new RegExp(regex).test(key)
                // && dateString !== dateCurrentString
            ) {
                this.schedulerRegistry.deleteCronJob(key);
            }
        });
    }

    @Cron('40 6 * * * ')
    async cronJob() {
        this.logger.info(`run cron job at 6:40 AM - ${new Date().toLocaleDateString()}`);

        const currentDate = new Date();
        const nextDate = addDays(currentDate, 1);
        const beforeDate = addDays(currentDate, -1);

        // delete job before day
        await this.deleteJobs(beforeDate);

        // delete job next day
        await this.deleteJobs(nextDate);

        // create jobs next day
        await this.createJobsNextDay();

        // create bonus next day
        await this.manageBonusPriceService.initBonusPrice(nextDate);

        // delete job reset bonus before date
        await this.deleteJobResetBonus(beforeDate);

        // delete job reset bonus next date
        await this.deleteJobResetBonus(nextDate);

        // create job reset bonus next date
        await this.generateJobResetBonus(nextDate);

        // delete orders of test player
        this.ordersService.deleteOrdersOfTestPlayer();

        // delete lottery awards of test player
        this.lotteryAwardService.deleteLotteryAwardsOfTestPlayer();
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

        for (const userId of userIds) {
            this.calcBanlance({
                isTestPlayer,
                gameType,
                bookmakerId,
                userId,
                turnIndex,
                prizes,
            });
        }
    }

    async calcBanlance({
        isTestPlayer,
        gameType,
        bookmakerId,
        userId,
        turnIndex,
        prizes
    }: any) {
        // get orders of bookmaker by game type (example: sxmb45s)
        let keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGame(bookmakerId.toString(), gameType);
        if (isTestPlayer) {
            keyOrdersOfBookmakerAndGameType = OrderHelper.getKeySaveOrdersOfBookmakerAndTypeGameTestPlayer(bookmakerId.toString(), gameType);
        }

        const winningPlayerOrders = []; // order users thang cuoc.
        const keyByUserAndTurnIndex = OrderHelper.getKeyByUserAndTurnIndex(userId.toString(), turnIndex);
        const mergeKey = `${keyOrdersOfBookmakerAndGameType}-${keyByUserAndTurnIndex}`;
        const ordersOfUser = await this.redisService.hgetall(mergeKey);

        if (!ordersOfUser || Object.keys(ordersOfUser).length === 0) {
            return;
        }

        const ordersCancel = await this.redisService.hgetall(`${mergeKey}-cancel-orders`);
        const promises = [];
        const promisesCreateWinningNumbers = [];
        const ordersWin = [];
        const limitPayOut = await this.settingsService.getLimitPayout();
        let totalBalance = 0;
        let isLimitPayout = false;
        let finalWinningAmount = 0;
        for (const key in ordersOfUser) {
            if (ordersCancel[key] && Object.keys(ordersCancel[key]).length > 0) continue;

            const [orderId, region, betType, childBetType] = key.split('-');
            const { realWinningAmount, winningNumbers, winningAmount } = OrderHelper.calcBalanceEachOrder({
                orders: JSON.parse(ordersOfUser[key]),
                childBetType,
                prizes,
            });

            totalBalance += winningAmount;
            finalWinningAmount = realWinningAmount;

            // user win vs order hien tai
            if (realWinningAmount > 0) {
                isLimitPayout = (!limitPayOut ? false : (realWinningAmount > limitPayOut));
                if (isLimitPayout) {
                    finalWinningAmount = limitPayOut;
                }

                winningPlayerOrders.push(orderId);
                ordersWin.push({
                    typeBetName: OrderHelper.getCategoryLotteryTypeName(betType),
                    childBetType: OrderHelper.getChildBetTypeName(childBetType),
                    orderId,
                    type: region,
                    amount: finalWinningAmount,
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
                    paymentWin: finalWinningAmount,
                    status: ORDER_STATUS.closed,
                    amountExceedsLimit: realWinningAmount - finalWinningAmount,
                },
                null,
            ));
        }

        // save winning numbers
        if (promisesCreateWinningNumbers.length > 0) {
            Promise.all(promisesCreateWinningNumbers);
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }

        // check nuoi so
        const { refunds } = await this.handlerHoldingNumbers({
            winningPlayerOrders,
            bookmakerId,
            userId,
            usernameReal: isTestPlayer ? true : false,
        });

        const wallet = await this.walletHandlerService.findWalletByUserIdFromRedis(+userId);
        const { balance: remainBalance } = await this.walletHandlerService.updateBalance(+userId, Number(totalBalance + refunds));

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
            this.logger.info(`userId ${userId} test player send event payment :: ${turnIndex}`);
        } else {
            this.logger.info(`userId ${userId} send event payment :: ${turnIndex}`);
        }
        this.socketGateway.sendEventToClient(`${userId}-receive-payment`, {
            ordersWin,
        });

        // delete key in redis
        this.redisService.del(mergeKey);
        this.redisService.del(`${mergeKey}-cancel-orders`);
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

    async generateJobResetBonus(date: Date) {
        if (!date) return;

        this.logger.info(`generate job reset bonus - ${new Date(date).toLocaleDateString()}`);
        let timeResetBonus = await this.settingsService.getTimeResetBonus();
        timeResetBonus = Number(timeResetBonus);
        if (!timeResetBonus) return;

        const startTime = startOfDay(date);
        const turns = 24 / timeResetBonus;
        // const turns = 1440;
        const fromDate = addHours(startTime, START_TIME_CREATE_JOB).getTime();
        const toDate = fromDate + ((24 * 60 * 60) - (MAINTENANCE_PERIOD * 60)) * 1000;

        for (let i = 1; i <= turns; i++) {
            const timeMillisecondsStartRunJob = addHours(startTime, (timeResetBonus * i)).getTime();
            // const timeMillisecondsStartRunJob = startTime.getTime() + (i * 1 * 60 * 1000);
            if (timeMillisecondsStartRunJob < (new Date()).getTime()) continue;

            const key = `reset-bonus-${DateTimeHelper.formatDate((new Date(date)))}-${i}`;
            this.addCronJobResetBonus({
                time: timeMillisecondsStartRunJob,
                name: key,
                fromDate,
                toDate,
            });
        }
    }

    addCronJobResetBonus({
        time,
        name,
        fromDate,
        toDate,
    }: {
        time: number,
        name: string
        fromDate: number,
        toDate: number,
    }) {
        try {
            const job = new CronJob(new Date((time)), () => {
                this.resetBonus({
                    fromDate,
                    toDate,
                });
            });
            this.schedulerRegistry.addCronJob(name, job);
            job.start();
        } catch (err) {
            console.log(err);
        }
    }

    deleteJobResetBonus(date: Date) {
        this.logger.info(`delete job reset bonus - ${new Date(date).toLocaleDateString()}`);
        const jobs = this.schedulerRegistry.getCronJobs();

        jobs.forEach((value, key, map) => {
            const regex = `reset-bonus`;
            if (new RegExp(regex).test(key)) {
                this.schedulerRegistry.deleteCronJob(key);
            }
        });
    }

    async resetBonus({
        fromDate,
        toDate,
    }: {
        fromDate: number,
        toDate: number,
    }) {
        const gameTypes = [
            TypeLottery.XSMB_1S,
            TypeLottery.XSMT_1S,
            TypeLottery.XSMN_1S,
            TypeLottery.XSSPL_1S,
            TypeLottery.XSMB_45S,
            TypeLottery.XSMT_45S,
            TypeLottery.XSMN_45S,
            TypeLottery.XSSPL_45S,
            TypeLottery.XSSPL_60S,
            TypeLottery.XSSPL_90S,
            TypeLottery.XSSPL_120S,
            TypeLottery.XSMB_180S,
            TypeLottery.XSMT_180S,
            TypeLottery.XSMN_180S,
            TypeLottery.XSSPL_360S,
        ];
        const promises = [];
        for (const gameType of gameTypes) {
            promises.push(this.manageBonusPriceService.resetBonus({
                toDate,
                fromDate,
                type: gameType,
                isTestPlayer: false,
            }));

            promises.push(this.manageBonusPriceService.resetBonus({
                toDate,
                fromDate,
                type: gameType,
                isTestPlayer: true,
            }));
        }

        return await Promise.all(promises);
    }
}