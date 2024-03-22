import { Injectable } from '@nestjs/common';
import { CreateLotteryAwardDto } from './dto/create-lottery.award.dto';
import { UpdateLotteryAwardDto } from './dto/update-lottery.award.dto';
import { PaginationQueryDto } from 'src/common/common.dto';
import { BaseResponse, ErrorResponse, SuccessResponse } from 'src/system/BaseResponse';
import { InjectRepository } from '@nestjs/typeorm';
import { LotteryAward } from './entities/lottery.award.entity';
import { Between, Repository } from 'typeorm';
import { MESSAGE, STATUSCODE } from 'src/system/constants';
import { endOfDay, startOfDay } from 'date-fns';

@Injectable()
export class LotteryAwardService {
  constructor(
    @InjectRepository(LotteryAward)
    private lotteryAwardRepository: Repository<LotteryAward>,
  ) { }

  create(createLotteryAwardDto: CreateLotteryAwardDto) {
    return 'This action adds a new lotteryAward';
  }

  async findAll(paginationQueryDto: PaginationQueryDto): Promise<BaseResponse> {
    try {
      const object: any = JSON.parse(paginationQueryDto.keyword);

      const lotteryAwards = await this.searchAdminGetAll(
        paginationQueryDto,
        object
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
