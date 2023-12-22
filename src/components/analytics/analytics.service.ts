
import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { endOfDay, format, startOfDay } from "date-fns";
import { Between, LessThan, Repository } from "typeorm";
import { LotteryAwardService } from "../lottery.award/lottery.award.service";
import { LotteryAward } from "../lottery.award/lottery.award.entity";
import { SuccessResponse } from "src/system/BaseResponse";
import { MESSAGE, STATUSCODE } from "src/system/constants";
import { Ianalytic1 } from "./enum/analytics.enum";
import { CategoryLotteryType } from "src/system/enums/lotteries";
import { BaoLoType, LoXienType, DanhDeType, DauDuoiType, BaCangType, BonCangType, LoTruocType } from "src/system/enums/lotteries";
import { BodyAnalyticsDto } from "./dto/bodyAnalytics.dto";



@Injectable()
export class AnalyticsService {
    private analytic1: {
        ngan: { [key: string]: number }
        tram: { [key: string]: number }
        dau: { [key: string]: number }
        duoi: { [key: string]: number }
    } = null
    constructor(
        @InjectRepository(LotteryAward)
        private lotteryAwardRepository: Repository<LotteryAward>,
    ) {
        this.analytic1 = Ianalytic1
    }

    async getAnalytics(body: BodyAnalyticsDto) {
        const searching = await this.lotteryAwardRepository.findAndCount({
            select: {
                id: true,
                type: true,
                awardDetail: true,
                awardTitle: true,
            },
            where: {
                type: body.lottType,
            },
            take: 50,
            order: { createdAt: 'DESC' },
        });

        let arrAwards: string[] = []
        const countMap: { [key: string]: number } = {};
        const countMapShow: { [key: string]: number } = {};

        if (body.subPlayType === BaoLoType.Lo3So || body.playType === CategoryLotteryType.Lo3Cang) {
            for (let i = 0; i < 1000; i++) {
                const twoDigits = i < 10 ? `00${i}` : (i >= 10 && i < 100) ? `0${i}` : i.toString();
                countMapShow[twoDigits] = 0;
            }
        } else {
            for (let i = 0; i < 100; i++) {
                const twoDigits = i < 10 ? `0${i}` : i.toString();
                countMapShow[twoDigits] = 0;
            }
        }

        searching[0].forEach((e: any) => {
            arrAwards.push(JSON.parse(e?.awardDetail))
        })

        let result: any = {}
        switch (body.playType) {
            case CategoryLotteryType.BaoLo:
            case CategoryLotteryType.LoXien:
                result = this.analyticsForBaolo_LoXien(body, arrAwards, countMap, countMapShow)
                break;

            case CategoryLotteryType.DanhDe:
                result = this.analyticsForDanhDe(body, arrAwards)
                break;

            case CategoryLotteryType.DauDuoi:
                result = this.analyticsForDauDuoi(body, arrAwards)
                break;

            case CategoryLotteryType.Lo3Cang:
                result = this.analyticsFor3Cang(body, arrAwards)
                break;

        }

        return new SuccessResponse(
            STATUSCODE.COMMON_SUCCESS,
            result,
            MESSAGE.LIST_SUCCESS
        );
    }

    analyticsForBaolo_LoXien(
        body: BodyAnalyticsDto,
        arrAwards: string[],
        countMap: { [key: string]: number },
        countMapShow: { [key: string]: number }) {

        if (body.subPlayType == BaoLoType.Lo3So) {
            for (const item of arrAwards) {
                for (const el of item.slice(0, 8)) {
                    const numbers = el.split(",");
                    // Duyệt qua mảng dữ liệu và thực hiện việc lấy 3 chữ số cuối và đếm
                    for (const number of numbers) {
                        const lastThreeDigits = number.slice(-3).toString();
                        if (countMap.hasOwnProperty(lastThreeDigits)) {
                            countMap[lastThreeDigits] = 0;
                            countMapShow[lastThreeDigits] = countMap[lastThreeDigits]
                        } else {
                            countMap[lastThreeDigits] == countMapShow[lastThreeDigits]++
                        }
                    }
                }
            }
        } else if (body.subPlayType == BaoLoType.Lo2So) {
            for (const item of arrAwards) {
                for (const el of item) {
                    const numbers = el.split(",");
                    // Duyệt qua mảng dữ liệu và thực hiện việc lấy 2 chữ số cuối và đếm
                    for (const number of numbers) {
                        const lastTwoDigits = number.slice(-2);
                        if (countMap.hasOwnProperty(lastTwoDigits)) {
                            countMap[lastTwoDigits] = 0;
                            countMapShow[lastTwoDigits] = countMap[lastTwoDigits]
                        } else {
                            countMap[lastTwoDigits] == countMapShow[lastTwoDigits]++
                        }
                    }
                }
            }
        }
        else {
            for (const item of arrAwards) {
                for (const el of item) {
                    const numbers = el.split(",");
                    // Duyệt qua mảng dữ liệu và thực hiện việc lấy 2 chữ số cuối và đếm
                    for (const number of numbers) {
                        const firstTwoDigits = number.slice(0, 2);
                        if (countMap.hasOwnProperty(firstTwoDigits)) {
                            countMap[firstTwoDigits] = 0;
                            countMapShow[firstTwoDigits] = countMap[firstTwoDigits]
                        } else {
                            countMap[firstTwoDigits] == countMapShow[firstTwoDigits]++
                        }
                    }
                }
            }
        }


        return {
            analytic1: {},
            analytic2: countMapShow
        }

    }

    analyticsForDanhDe(
        body: BodyAnalyticsDto,
        arrAwards: string[],
    ) {
        this.analytic1.ngan = {}
        this.analytic1.tram = {}
        let analytic2: { [key: string]: number }

        switch (body.subPlayType) {

            case DanhDeType.DeDau:
            case DanhDeType.DeDacBiet:
                for (const item of arrAwards) {
                    const award = DanhDeType.DeDau ? item[8] : item[0]
                    const dauNum = award.charAt(0)
                    const duoiNum = award.charAt(1)

                    for (const key in this.analytic1.dau) {
                        if (key === dauNum) {
                            this.analytic1.dau[dauNum] = 0
                        } else {
                            this.analytic1.dau[key] += 1
                        }
                    }
                    for (const key in this.analytic1.duoi) {
                        if (key === duoiNum) {
                            this.analytic1.duoi[duoiNum] = 0
                        } else {
                            this.analytic1.duoi[key] += 1
                        }
                    }
                }
                break;

            case DanhDeType.DeDauDuoi:
                for (const item of arrAwards) {
                    for (const award of [item[8], item[0]]) {
                        const dauNum = award.charAt(0)
                        const duoiNum = award.charAt(1)

                        for (const key in this.analytic1.dau) {
                            if (key === dauNum) {
                                this.analytic1.dau[dauNum] = 0
                            } else {
                                this.analytic1.dau[key] += 1
                            }
                        }
                        for (const key in this.analytic1.duoi) {
                            if (key === duoiNum) {
                                this.analytic1.duoi[dauNum] = 0
                            } else {
                                this.analytic1.duoi[key] += 1
                            }
                        }
                    }
                }
                break;
        }

        return {
            analytic1: this.analytic1,
            analytic2: {}
        }
    }

    analyticsForDauDuoi(
        body: BodyAnalyticsDto,
        arrAwards: string[],
    ) {
        this.analytic1.ngan = {}
        this.analytic1.tram = {}
        let analytic2: { [key: string]: number }

        for (const item of arrAwards) {
            const award = item[0]

            if (body.subPlayType === DauDuoiType.Dau) {
                this.analytic1.duoi = {}
                const dauNum = award.charAt(4)
                for (const key in this.analytic1.dau) {
                    if (key === dauNum) {
                        this.analytic1.dau[dauNum] = 0
                    } else {
                        this.analytic1.dau[key] += 1
                    }
                }
            } else {
                this.analytic1.dau = {}
                const duoiNum = award.charAt(5)
                for (const key in this.analytic1.duoi) {
                    if (key === duoiNum) {
                        this.analytic1.duoi[duoiNum] = 0
                    } else {
                        this.analytic1.duoi[key] += 1
                    }
                }
            }
        }

        return {
            analytic1: this.analytic1,
            analytic2: {}
        }
    }

    analyticsFor3Cang(
        body: BodyAnalyticsDto,
        arrAwards: string[],
    ) {
        this.analytic1.ngan = {}
        this.analytic1.tram = {}
        let analytic2: { [key: string]: number }

        switch (body.subPlayType) {

            case BaCangType.BaCangDau:
            case BaCangType.BaCangDacBiet:
                for (const item of arrAwards) {
                    const award = BaCangType.BaCangDau ? item[7] : item[0]
                    const dauNum = award.charAt(0)
                    const duoiNum = award.charAt(1)

                    for (const key in this.analytic1.dau) {
                        if (key === dauNum) {
                            this.analytic1.dau[dauNum] = 0
                        } else {
                            this.analytic1.dau[key] += 1
                        }
                    }
                    for (const key in this.analytic1.duoi) {
                        if (key === duoiNum) {
                            this.analytic1.duoi[duoiNum] = 0
                        } else {
                            this.analytic1.duoi[key] += 1
                        }
                    }
                }
                break;

            case BaCangType.BaCangDauDuoi:
                for (const item of arrAwards) {
                    for (const award of [item[8], item[0]]) {
                        const dauNum = award.charAt(0)
                        const duoiNum = award.charAt(1)

                        for (const key in this.analytic1.dau) {
                            if (key === dauNum) {
                                this.analytic1.dau[dauNum] = 0
                            } else {
                                this.analytic1.dau[key] += 1
                            }
                        }
                        for (const key in this.analytic1.duoi) {
                            if (key === duoiNum) {
                                this.analytic1.duoi[dauNum] = 0
                            } else {
                                this.analytic1.duoi[key] += 1
                            }
                        }
                    }
                }
                break;
        }

        return {
            analytic1: this.analytic1,
            analytic2: {}
        }
    }

}
