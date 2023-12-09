import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';
import { LotteriesService } from 'src/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';
import { addDays, addMinutes, startOfDay } from 'date-fns';


@Injectable()
export class ScheduleService implements OnModuleInit {
    constructor(
        private schedulerRegistry: SchedulerRegistry,
        private readonly redisService: RedisCacheService,
        private readonly lotteriesService: LotteriesService,
        private readonly socketGateway: SocketGatewayService,
    ) { }

    onModuleInit() {
        console.log("init schedule");
        this.initJobs();
    }

    initJobs() {
        this.deleteAllJob();
        this.createJobs(45);
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
                const jobName = `${(new Date()).toLocaleDateString()}-${count}`;
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
            const jobName = `${(tomorrow).toLocaleDateString()}-${countOfNextDay}`;
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
        let data;
        switch (seconds) {
            case 45:
                data = await this.redisService.get("xsspl45s");
                await this.redisService.del("xsspl45s");
                this.handleXsspl45s(data, jobName, time, turnIndex, nextTurnIndex, nextTime);
                break;

            case 90:
                break;

            default:
                break;
        }
    }

    handleXsspl45s(data: any, jobName: string, time: number, turnIndex: string, nextTurnIndex: string, nextTime: number) {
        this.deleteCron(jobName);
        if (!data) {
            data = [];
        }
        const dataTransform = this.transformData(data);
        const prizes = this.lotteriesService.generatePrizes(dataTransform);
        const finalResult = this.lotteriesService.randomPrizes(prizes);

        this.socketGateway.sendEventToClient('xsspl45s-receive-prizes', {
            type: 'xsspl45s',
            turnIndex,
            nextTime,
            nextTurnIndex,
            openTime: time,
            awardDetail: finalResult,
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
}