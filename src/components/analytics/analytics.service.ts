
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

  async getAnalytics(body: BodyAnalyticsDto, member: any) {
    let searching = await this.lotteryAwardRepository.find({
      select: {
        id: true,
        type: true,
        awardDetail: true,
        // awardTitle: true,
      },
      where: {
        type: body.lottType,
        isTestPlayer: member?.usernameReal == "" ? false : true,
      },
      take: 50,
      order: { createdAt: "DESC" },
    });

    searching = searching.sort((a: any, b: any) => a.id - b.id);

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

    searching.forEach((e: any) => {
      arrAwards.push(JSON.parse(e?.awardDetail))
    })

    let result: any = {}
    switch (body.playType) {
      case CategoryLotteryType.BaoLo:
      case CategoryLotteryType.LoXien:
      case CategoryLotteryType.LoTruot:
        result = this.analyticsForBaolo_LoXien_LoTruot(body, arrAwards, countMap, countMapShow)
        break;

      case CategoryLotteryType.DanhDe:
        result = this.analyticsForDanhDe(body, arrAwards, countMap, countMapShow)
        break;

      case CategoryLotteryType.DauDuoi:
        result = this.analyticsForDauDuoi(body, arrAwards)
        break;

      case CategoryLotteryType.Lo3Cang:
        result = this.analyticsFor3Cang(body, arrAwards, countMap, countMapShow)
        break;

      case CategoryLotteryType.Lo4Cang:
        result = this.analyticsFor4Cang(body, arrAwards)
        break;

    }

    return new SuccessResponse(
      STATUSCODE.COMMON_SUCCESS,
      result,
      MESSAGE.LIST_SUCCESS
    );
  }

  analyticsForBaolo_LoXien_LoTruot(
    body: BodyAnalyticsDto,
    arrAwards: any[],
    countMap: { [key: string]: number },
    countMapShow: { [key: string]: number }) {

    let litNumFind: any = []

    if (body.subPlayType == BaoLoType.Lo3So) {
      for (const item of arrAwards) {
        litNumFind = []
        for (const el in item) {
          // const numbers = el.split(",");
          // Duyệt qua mảng dữ liệu và thực hiện việc lấy 3 chữ số cuối và đếm
          for (const number of item[el]) {
            if (number.length > 2) {
              const lastThreeDigits = number.slice(-3).toString();
              litNumFind.push(lastThreeDigits);
              // if (countMap.hasOwnProperty(lastThreeDigits)) {
              //     countMap[lastThreeDigits] = 0;
              //     countMapShow[lastThreeDigits] = countMap[lastThreeDigits]
              // } else {
              //     countMap[lastThreeDigits] == countMapShow[lastThreeDigits]++
              // } 
            }
          }
        }

        Object.keys(countMapShow).forEach((key: any) => {
          if (!litNumFind.includes(key)) {
            countMapShow[key] += 1;
          }
        });

        litNumFind.forEach((key: any) => {
          if (countMapShow.hasOwnProperty(key)) {
            countMapShow[key] = 0;
          }
        });
      }
    } else if (body.subPlayType == BaoLoType.Lo2SoDau) {
      for (const item of arrAwards) {
        litNumFind = []
        for (const el in item) {
          // const numbers = el.split(",");
          // Duyệt qua mảng dữ liệu và thực hiện việc lấy 2 chữ số cuối và đếm
          for (const number of item[el]) {
            const firstTwoDigits = number.slice(0, 2);
            litNumFind.push(firstTwoDigits);
            // if (countMap.hasOwnProperty(firstTwoDigits)) {
            //     countMap[firstTwoDigits] = 0;
            //     countMapShow[firstTwoDigits] = countMap[firstTwoDigits]
            // } else {
            //     countMap[firstTwoDigits] == countMapShow[firstTwoDigits]++
            // }
          }
        }
  
        Object.keys(countMapShow).forEach((key: any) => {
          if (!litNumFind.includes(key)) {
            countMapShow[key] += 1;
          }
        });

        litNumFind.forEach((key: any) => {
          if (countMapShow.hasOwnProperty(key)) {
            countMapShow[key] = 0;
          }
        });
      }
    } else if (body.subPlayType == BaoLoType.Lo4So) {
      countMapShow = {}
    } else {
      for (const item of arrAwards) {
        litNumFind = []
        for (const el in item) {
          // const numbers = el.split(",");
          // Duyệt qua mảng dữ liệu và thực hiện việc lấy 2 chữ số cuối và đếm
          for (const number of item[el]) {
            const lastTwoDigits = number.slice(-2);
            litNumFind.push(lastTwoDigits);
          }
        }

        Object.keys(countMapShow).forEach((key: any) => {
          if (!litNumFind.includes(key)) {
            countMapShow[key] += 1;
          }
        });

        litNumFind.forEach((key: any) => {
          if (countMapShow.hasOwnProperty(key)) {
            countMapShow[key] = 0;
          }
        });
      }
    }

    return {
      analytic1: {},
      analytic2: countMapShow
    }

  }

  analyticsForDanhDe(
    body: BodyAnalyticsDto,
    arrAwards: any[],
    countMap: { [key: string]: number },
    countMapShow: { [key: string]: number }
  ) {
    let litNumFind: any = [];
    let analytic1: any = {
      tram: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      ngan: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      dau: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      duoi: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
    }
    this.analytic1.ngan = {}
    this.analytic1.tram = {}
    const dataDf = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
    }

    switch (body.subPlayType) {

      case DanhDeType.DeDau:
      case DanhDeType.DeDacBiet:
        for (const item of arrAwards) {
          const award: string = (body.subPlayType === DanhDeType.DeDau) ? item[8][0] : item[0][0]
          const dauNum = award.charAt(body.subPlayType === DanhDeType.DeDau ? 0 : 4)
          const duoiNum = award.charAt(body.subPlayType === DanhDeType.DeDau ? 1 : 5)

          for (const key in dataDf) {
            if (key === dauNum) {
              analytic1.dau[dauNum] = 0
            } else {
              analytic1.dau[key] += 1
            }
          }
          for (const key in dataDf) {
            if (key === duoiNum) {
              analytic1.duoi[duoiNum] = 0
            } else {
              analytic1.duoi[key] += 1
            }
          }
        }
        // analytic2
        for (const item of arrAwards) {
          litNumFind = []
          const number: string = (body.subPlayType === DanhDeType.DeDau) ? item[8][0] : item[0][0]
          const lastTwoDigits = number.slice(-2);
          litNumFind.push(lastTwoDigits)
          // if (countMap.hasOwnProperty(lastTwoDigits)) {
          //     countMap[lastTwoDigits] = 0;
          //     countMapShow[lastTwoDigits] = countMap[lastTwoDigits]
          // } else {
          //     countMap[lastTwoDigits] == countMapShow[lastTwoDigits]++
          // }

          Object.keys(countMapShow).forEach((key: any) => {
            if (!litNumFind.includes(key)) {
              countMapShow[key] += 1;
            }
          });

          litNumFind.forEach((key: any) => {
            if (countMapShow.hasOwnProperty(key)) {
              countMapShow[key] = 0;
            }
          });
        }

        break;

      case DanhDeType.DeDauDuoi:
        for (const item of arrAwards) {
          for (const award of [item[8][0], item[0][0]]) {
            const dauNum = award.charAt(0)
            const duoiNum = award.charAt(1)

            for (const key in dataDf) {
              if (key === dauNum) {
                analytic1.dau[dauNum] = 0
              } else {
                analytic1.dau[key] += 1
              }
            }
            for (const key in dataDf) {
              if (key === duoiNum) {
                analytic1.duoi[dauNum] = 0
              } else {
                analytic1.duoi[key] += 1
              }
            }
          }
        }
        // analytic2
        for (const item of arrAwards) {
          litNumFind = []
          for (const number of [item[8][0], item[0][0]]) {
            const lastTwoDigits = number.slice(-2);
            litNumFind.push(lastTwoDigits)
            // if (countMap.hasOwnProperty(lastTwoDigits)) {
            //     countMap[lastTwoDigits] = 0;
            //     countMapShow[lastTwoDigits] = countMap[lastTwoDigits]
            // } else {
            //     countMap[lastTwoDigits] == countMapShow[lastTwoDigits]++
            // }
          }

          Object.keys(countMapShow).forEach((key: any) => {
            if (!litNumFind.includes(key)) {
              if (countMapShow[key]) {
                countMapShow[key] += 1;
              }
            }
          });

          litNumFind.forEach((key: any) => {
            if (countMapShow.hasOwnProperty(key)) {
              countMapShow[key] = 0;
            }
          });
        }
        break;
    }

    return {
      analytic1: analytic1,
      analytic2: countMapShow
    }
  }

  analyticsForDauDuoi(
    body: BodyAnalyticsDto,
    arrAwards: any[],
  ) {
    let analytic1: any = {
      tram: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      ngan: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      dau: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      duoi: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
    }
    this.analytic1.ngan = {}
    this.analytic1.tram = {}
    const dataDf = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
    }

    for (const item of arrAwards) {
      const award = item[0][0]

      if (body.subPlayType === DauDuoiType.Dau) {
        analytic1.duoi = {}
        const dauNum = award.charAt(4)
        for (const key in dataDf) {
          if (key === dauNum) {
            analytic1.dau[dauNum] = 0
          } else {
            analytic1.dau[key] += 1
          }
        }
      } else {
        analytic1.dau = {}
        const duoiNum = award.charAt(5)
        for (const key in dataDf) {
          if (key === duoiNum) {
            analytic1.duoi[duoiNum] = 0
          } else {
            analytic1.duoi[key] += 1
          }
        }
      }
    }

    return {
      analytic1: analytic1,
      analytic2: {}
    }
  }

  analyticsFor3Cang(
    body: BodyAnalyticsDto,
    arrAwards: any[],
    countMap: { [key: string]: number },
    countMapShow: { [key: string]: number }
  ) {
    let analytic1: any = {
      tram: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      ngan: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      dau: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      duoi: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
    }
    this.analytic1.ngan = {}
    const dataDf = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
    }

    switch (body.subPlayType) {

      case BaCangType.BaCangDau:
      case BaCangType.BaCangDacBiet:
        for (const item of arrAwards) {
          const award: string = (body.subPlayType === BaCangType.BaCangDau) ? item[7][0] : item[0][0].slice(-3)
          const tramNum = award.charAt(0)
          const dauNum = award.charAt(1)
          const duoiNum = award.charAt(2)

          for (const key in dataDf) {
            if (key === tramNum) {
              analytic1.tram[tramNum] = 0
            } else {
              analytic1.tram[key] += 1
            }
          }
          for (const key in dataDf) {
            if (key === dauNum) {
              analytic1.dau[dauNum] = 0
            } else {
              analytic1.dau[key] += 1
            }
          }
          for (const key in dataDf) {
            if (key === duoiNum) {
              analytic1.duoi[duoiNum] = 0
            } else {
              analytic1.duoi[key] += 1
            }
          }
        }
        // analytic2
        let litNumFind: any = []
        for (const item of arrAwards) {
          litNumFind = []
          const number: string = (body.subPlayType === BaCangType.BaCangDau) ? item[7][0] : item[0][0]
          const lastThreeDigits = number.slice(-3);
          litNumFind.push(lastThreeDigits);
          // if (countMap.hasOwnProperty(lastThreeDigits)) {
          //     countMap[lastThreeDigits] = 0;
          //     countMapShow[lastThreeDigits] = countMap[lastThreeDigits]
          // } else {
          //     countMap[lastThreeDigits] == countMapShow[lastThreeDigits]++
          // }

          Object.keys(countMapShow).forEach((key: any) => {
            if (!litNumFind.includes(key)) {
              countMapShow[key] += 1;
            }
          });
  
          litNumFind.forEach((key: any) => {
            if (countMapShow.hasOwnProperty(key)) {
              countMapShow[key] = 0;
            }
          });
        }

        break;

      case BaCangType.BaCangDauDuoi:
        for (const item of arrAwards) {
          for (const award of [item[7][0], item[0][0]]) {
            const tramNum = award.charAt(0)
            const dauNum = award.charAt(1)
            const duoiNum = award.charAt(2)

            for (const key in dataDf) {
              if (key === tramNum) {
                analytic1.tram[tramNum] = 0
              } else {
                analytic1.tram[key] += 1
              }
            }
            for (const key in dataDf) {
              if (key === dauNum) {
                analytic1.dau[dauNum] = 0
              } else {
                analytic1.dau[key] += 1
              }
            }
            for (const key in dataDf) {
              if (key === duoiNum) {
                analytic1.duoi[dauNum] = 0
              } else {
                analytic1.duoi[key] += 1
              }
            }
          }
        }

        let litNumFindNe: any = []
        for (const item of arrAwards) {
          litNumFindNe = []
          for (const number of [item[7][0], item[0][0]]) {
            const lastThreeDigits = number.slice(-3)
            litNumFindNe.push(lastThreeDigits)
          }

          Object.keys(countMapShow).forEach((key: any) => {
            if (!litNumFindNe.includes(key)) {
              countMapShow[key] += 1;
            }
          });
  
          litNumFindNe.forEach((key: any) => {
            if (countMapShow.hasOwnProperty(key)) {
              countMapShow[key] = 0;
            }
          });
        }
        
        break;
    }

    return {
      analytic1: analytic1,
      analytic2: countMapShow
    }
  }

  analyticsFor4Cang(
    body: BodyAnalyticsDto,
    arrAwards: any[],
  ) {
    let analytic1: any = {
      tram: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      ngan: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      dau: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
      duoi: {
        '0': 0,
        '1': 0,
        '2': 0,
        '3': 0,
        '4': 0,
        '5': 0,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
      },
    }
    const dataDf = {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
    }

    for (const item of arrAwards) {
      const award: string = item[0][0].slice(-4)
      const nganNum = award.charAt(0)
      const tramNum = award.charAt(1)
      const dauNum = award.charAt(2)
      const duoiNum = award.charAt(3)

      for (const key in dataDf) {
        if (key === nganNum) {
          analytic1.ngan[nganNum] = 0
        } else {
          analytic1.ngan[key] += 1
        }
      }
      for (const key in dataDf) {
        if (key === tramNum) {
          analytic1.tram[tramNum] = 0
        } else {
          analytic1.tram[key] += 1
        }
      }
      for (const key in dataDf) {
        if (key === dauNum) {
          analytic1.dau[dauNum] = 0
        } else {
          analytic1.dau[key] += 1
        }
      }
      for (const key in dataDf) {
        if (key === duoiNum) {
          analytic1.duoi[duoiNum] = 0
        } else {
          analytic1.duoi[key] += 1
        }
      }
    }

    return {
      analytic1: analytic1,
      analytic2: {}
    }
  }

}
