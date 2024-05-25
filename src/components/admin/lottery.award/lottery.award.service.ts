import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateLotteryAwardDto } from './dto/create-lottery.award.dto';
import { UpdateLotteryAwardDto } from './dto/update-lottery.award.dto';
import { PaginationQueryDto } from 'src/common/common.dto';
import { BaseResponse, ErrorResponse, SuccessResponse } from 'src/system/BaseResponse';
import { InjectRepository } from '@nestjs/typeorm';
import { LotteryAward } from './entities/lottery.award.entity';
import { Between, Repository } from 'typeorm';
import { MESSAGE, STATUSCODE } from 'src/system/constants';
import { endOfDay, startOfDay, addHours, addDays } from 'date-fns';
import { Order } from 'src/components/orders/entities/order.entity';
import { ValidateRightsService } from '../validate-rights/validate-rights.service';
import { RIGHTS } from 'src/system/constants/rights';


@Injectable()
export class LotteryAwardService {
  constructor(
    @InjectRepository(LotteryAward)
    private lotteryAwardRepository: Repository<LotteryAward>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @Inject(forwardRef(() => ValidateRightsService))
    private validateRightsService: ValidateRightsService,
  ) { }

  create(createLotteryAwardDto: CreateLotteryAwardDto) {
    return 'This action adds a new lotteryAward';
  }

  async findAll(paginationQueryDto: PaginationQueryDto, user: any): Promise<BaseResponse> {
    try {
      const hasRight = await this.validateRightsService.hasRight({
        userId: user.id,
        rightsNeedCheck: [RIGHTS.AllowSearchFromBookmarker],
      });

      const object: any = JSON.parse(paginationQueryDto.keyword);
      if (!hasRight) {
        object.bookmarkerId = user.bookmakerId;
      }

      const lotteryAwards = await this.searchAdminGetAll(
        paginationQueryDto,
        object,
      );

      return new SuccessResponse(
        STATUSCODE.COMMON_SUCCESS,
        lotteryAwards,
        MESSAGE.LIST_SUCCESS
      );
    } catch (error) {
      return new ErrorResponse(
        STATUSCODE.COMMON_FAILED,
        error,
        MESSAGE.LIST_FAILED
      );
    }
  }

  async report({ fromDate, toDate, bookmarkerId, type, isTestPlayer }: any) {
    if (!fromDate && !toDate) return;
    let isTest = false;
    if (isTestPlayer === 'true') {
      isTest = true;
    }

    let fromD;
    let toD;
    if (fromDate && toDate) {
      fromD = startOfDay(new Date(fromDate));
      toD = endOfDay(new Date(toDate));
    } else if (fromDate) {
      fromD = startOfDay(new Date(fromDate));
      toD = endOfDay(new Date(fromDate));
    } else if (toDate) {
      fromD = startOfDay(new Date());
      toD = endOfDay(new Date(fromDate));
    }

    fromD = addHours(fromD, 7);
    toD = addHours(toD, 7);

    let gameType = '';
    if (type) {
      for (let i = 0; i < type.split('-').length; i++) {
        gameType += type.split('-')[i];
      }

      gameType += 's';
    }

    // count orders by type
    const queryOrders = `
      SELECT type, seconds, COUNT(*) as count from orders
      WHERE created_at >= '${fromD.toISOString()}' AND created_at <= '${toD.toISOString()}' AND status = 'closed' AND isTestPlayer = ${isTest}
      GROUP BY type, seconds
    `;
    const orders = await this.orderRepository.query(queryOrders);

    // calc totalbet and profit
    let query = `
      SELECT lottery.type, SUM(lottery.totalProfit) as totalProfit, SUM(lottery.totalRevenue) as totalRevenue
      FROM lottery_award AS lottery
      WHERE lottery.createdAt >= '${fromD.toISOString()}' AND lottery.createdAt <= '${toD.toISOString()}' AND lottery.isTestPlayer = ${isTest}
    `;

    if (bookmarkerId) {
      query += `AND lottery.bookmakerId = '${Number(bookmarkerId)}'`
    }
    if (gameType) {
      query += `AND lottery.type = '${gameType}'`
    }
    query += `GROUP BY type`;
    const lotteryAward = await this.lotteryAwardRepository.query(query);

    // assign number of order by type
    for (const lt of lotteryAward) {
      lt.count = 0;
      for (const order of orders) {
        const type = `${order.type}${order.seconds}s`;
        if (type === lt.type) {
          lt.count = order.count;
        }
      }
    }

    return lotteryAward;
  }

  async searchAdminGetAll(
    paginationQuery: PaginationQueryDto,
    lotteryAwardDto: any,
  ) {
    const { take: perPage, skip: page } = paginationQuery;
    if (page <= 0) {
      return "The skip must be more than 0";
    }
    const skip = +perPage * +page - +perPage;
    const searching = await this.lotteryAwardRepository.findAndCount({
      relations: ["bookmaker"],
      // select: {
      //   openTime: true,
      //   status: true,
      //   type: true,
      //   awardDetail: true,
      //   awardTitle: true,
      //   turnIndex: true,
      //   id: true,
      // },
      where: this.adminHoldQuery(lotteryAwardDto),
      take: +perPage,
      skip,
      order: { createdAt: paginationQuery.order },
    });

    return searching;
  }

  adminHoldQuery(object: any = null) {
    const data: any = {};
    if (!object) return data;

    for (const key in object) {
      switch (key) {
        case "type":
          data.type = object.type;
          break;

        case "turnIndex":
          data.turnIndex = object.turnIndex;
          break;

        case "bookmarkerId":
          data.bookmaker = { id: object.bookmarkerId };
          break;

        default:
          break;
      }

      if (key === "startDate" || key === "endDate") {
        let startDate = startOfDay(new Date(object.startDate));
        let endDate = endOfDay(new Date(object.endDate));
        const now = new Date();
        if (startDate.getTime() > now.getTime()) {
          startDate = now;
        }
        if (endDate.getTime() > now.getTime()) {
          endDate = now;
        }
        data.openTime = Between(startDate, endDate);
      }

      if (key === "isTestPlayer") {
        data.isTestPlayer = object.isTestPlayer;
      }
    }

    // let isTestPlayer = false;
    // if (usernameReal) {
    //   isTestPlayer = true;
    // }
    // data.bookmaker = { id: bookMakerId };
    // data.isTestPlayer = isTestPlayer;

    return data;
  }


  findOne(id: number) {
    return `This action returns a #${id} lotteryAward`;
  }

  update(id: number, updateLotteryAwardDto: UpdateLotteryAwardDto) {
    return `This action updates a #${id} lotteryAward`;
  }

  remove(id: number) {
    return `This action removes a #${id} lotteryAward`;
  }
}
