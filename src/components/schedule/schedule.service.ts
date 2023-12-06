import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CronJob } from 'cron';
import { LotteriesService } from 'src/lotteries/lotteries.service';
import { RedisCacheService } from 'src/system/redis/redis.service';
import { SocketGatewayService } from '../gateway/gateway.service';


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
        this.initJob();
    }

    initJob() {
        this.createJobs(45);
    }

    createJobs(seconds: number) {
        const time = `${(new Date()).toLocaleDateString()}, 07:00 AM`;
        const numberOfTurns = (17 * 60 * 60) / 45;
        let date = new Date(time).getTime();
        let count = 0;
        for (let i = 0; i < numberOfTurns; i++) {
            date = date + (seconds * 1000);
            if (date > (new Date()).getTime()) {
                count++;
                let turn = `${(new Date()).toLocaleDateString()}-${count}`;
                this.addCronJob(turn, seconds, date);
            }
        }
    }
    addCronJob(name: string, seconds: number, time: any) {
        const job = new CronJob(new Date((time)), () => {
            this.callbackFunc(name, seconds);
        });

        this.schedulerRegistry.addCronJob(name, job);
        job.start();
    }

    async callbackFunc(jobName: string, seconds: number) {
        let data;
        switch (seconds) {
            case 45:
                data = await this.redisService.get("xsspl45s");
                await this.redisService.del("xsspl45s");
                this.handleXsspl45s(data, jobName);
                break;

            case 90:
                break;

            default:
                break;
        }
    }

    handleXsspl45s(data: any, jobName: string) {
        this.deleteCron(jobName);
        if (!data) {
            data = [];
        }
        const dataTransform = this.transformData(data);
        const prizes = this.lotteriesService.generatePrizes(dataTransform);
        const finalResult = this.lotteriesService.randomPrizes(prizes);

        this.socketGateway.sendEventToClient('send-prizes-xsspl45s', {
            content: finalResult,
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
}