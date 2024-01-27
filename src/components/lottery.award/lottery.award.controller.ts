import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe
} from "@nestjs/common";
import { Cron, CronExpression, Interval } from "@nestjs/schedule";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PaginationQueryDto } from "../../common/common.dto";
import { Response } from "../../system/interfaces";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { UserRoles } from "../user/enums/user.enum";
import { GetLotteryAwardDto } from "./dto/get.data";
import { CreateLotteryAwardDto, UpdateLotteryAwardDto } from "./dto/index";
import { LotteryAward } from "./lottery.award.entity";
import { LotteryAwardService } from "./lottery.award.service";
import { CurrentAwardXsmb, TypeLottery } from "./enums/status.dto";
import { startOfDay } from "date-fns";
import { RequestDetailDto } from "../lottery.request/dto/request.detail.dto";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";

@Controller("/api/v1/lotteryAward")
@ApiTags("lotteryAward")
export class LotteryAwardController {
  constructor(private lotteryAwardService: LotteryAwardService) { }

  @Post('')
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async createLotteryAward(@Body() createLotteryAwardDto: CreateLotteryAwardDto): Promise<any> {
    return this.lotteryAwardService.createLotteryAward(createLotteryAwardDto);
  }

  // @Post("create")
  // @ApiBearerAuth("Authorization")
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  // @ApiOperation({
  //   description: "Create lotteryAward",
  // })
  // @ApiOkResponse({
  //   type: Response<LotteryAward>,
  // })
  // @Roles(UserRoles.SUPPER, UserRoles.OPTION1)
  // async create(@Body() createlotteryAwardDto: CreateLotteryAwardDto): Promise<any> {
  //   return this.lotteryAwardService.create(createlotteryAwardDto);
  // }

  @Get("allResult")
  @ApiResponse({
    status: 2000,
    description: "Get list lotteryAward success",
  })
  @ApiQuery({
    name: "take",
    type: "number",
    description: "enter take (Take is limit in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "skip",
    type: "number",
    description: "enter skip (Skip is offset in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "order",
    type: "string",
    description:
      "The ORDER BY keyword sorts the records in ascending order by default. To sort the records in descending order, use the DESC|ASC keyword",
    required: true,
  })
  @ApiOperation({
    description: "Get all lotteryAward",
  })
  @ApiOkResponse({
    type: Response<LotteryAward[]>,
  })
  async getAllNotBookmaer(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<any> {
    return this.lotteryAwardService.getAllNotCheckBookmaker(paginationQueryDto);
  }

  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list lotteryAward success",
  })
  @ApiQuery({
    name: "take",
    type: "number",
    description: "enter take (Take is limit in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "skip",
    type: "number",
    description: "enter skip (Skip is offset in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "order",
    type: "string",
    description:
      "The ORDER BY keyword sorts the records in ascending order by default. To sort the records in descending order, use the DESC|ASC keyword",
    required: true,
  })
  @ApiOperation({
    description: "Get all lotteryAward",
  })
  @ApiOkResponse({
    type: Response<LotteryAward[]>,
  })
  async getAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.lotteryAwardService.guestGetAll(paginationQueryDto, req.user);
  }

  // @Get("allType")
  // @ApiResponse({
  //   status: 2000,
  //   description: "Get list lotteryAward all type",
  // })
  // async getAllType(): Promise<any> {
  //   return this.lotteryAwardService.getAllType();
  // }

  // @Get("xsmb")
  // @ApiOperation({
  //   description: "Get xsmb",
  // })
  // @ApiOkResponse({
  //   type: Response<CurrentAwardXsmb>,
  // })
  // async getCurentXsmb(
  // ): Promise<any> {
  //   return this.lotteryAwardService.getCurentXsmb();
  // }

  @Get(":type/info")
  @ApiOperation({
    description: "Get info lottery current",
  })
  @ApiOkResponse({
    type: Response<CurrentAwardXsmb>,
  })
  async getCurentXsqmb(
    @Param("type") type: string
  ): Promise<any> {
    return this.lotteryAwardService.getLottery(type);
  }

  @Get("user-all")
  @ApiResponse({
    status: 2000,
    description: "Get list lotteryAward success",
  })
  @ApiQuery({
    name: "take",
    type: "number",
    description: "enter take (Take is limit in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "skip",
    type: "number",
    description: "enter skip (Skip is offset in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "order",
    type: "string",
    description:
      "The ORDER BY keyword sorts the records in ascending order by default. To sort the records in descending order, use the DESC|ASC keyword",
    required: true,
  })
  @ApiOperation({
    description: "Get all lotteryAward",
  })
  @ApiOkResponse({
    type: Response<LotteryAward[]>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async userGetAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.lotteryAwardService.userGetAll(paginationQueryDto, req.user);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get lotteryAward by id",
  })
  @ApiOkResponse({
    type: Response<LotteryAward>,
  })
  @Roles(UserRoles.SUPPER)
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.lotteryAwardService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update lotteryAward",
  })
  @ApiOkResponse({
    type: Response<LotteryAward>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatelotteryAwardDto: UpdateLotteryAwardDto
  ): Promise<any> {
    return this.lotteryAwardService.update(id, updatelotteryAwardDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete lotteryAward",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.lotteryAwardService.delete(id);
  }


  // @Cron('0 32 18 * * *') // Chạy vào 18:32 hàng ngày
  // // @Cron("*/1 * * * *")
  // async handleCron() {
  //   // get KQXS MB
  //   const dateTime = new Date();
  //   const typeLotrery = 'xsmb';
  //   this.lotteryAwardService.processJobGetXsmb(dateTime, dateTime, typeLotrery, true);
  // }

  // @Cron('*/15 * * * * *') // job 45s
  // async handleCronXsmb45s() {
  //   const now = new Date();
  //   const cycle = 45000;
  //   const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
  //   const turn = Math.floor(minutesSinceMidnight / + cycle);
    
  //   if (now.getTime() - startOfDay(now).getTime() - turn * cycle < 10000) {
  //     // TODO lock redis with turn index
  //     await new Promise((resolve) => setTimeout(resolve, 10));
  //     this.lotteryAwardService.processXsmb45sAward();
  //   }
  // }

  // @Post("real")
  // @ApiOperation({
  //   description: "get lotteryAward",
  // })
  // @ApiOkResponse({
  //   type: Response<LotteryAward>,
  // })
  // @UsePipes(ValidationPipe)
  // @ApiBearerAuth("Authorization")
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
  // @Roles(UserRoles.SUPPER)
  // async getLotteryReal(
  //   @Body() getDataDto: GetLotteryAwardDto
  // ): Promise<any> {
  //   return this.lotteryAwardService.processJobGetXsmb(new Date(getDataDto.fromDate), new Date(getDataDto.toDate), getDataDto.type);
  // }

  // mien bac -- start
  // @Cron('*/45 * * * * *') // job 45s
  // @Interval(45000)
  // async handleCronXsmb45s() {
  //   // const now = new Date();
  //   // const cycle = 45000;
  //   // const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
  //   // const turn = Math.floor(minutesSinceMidnight / +cycle);

  //   // check này là do cron ko support chạy 45s
  //   // if (now.getTime() - startOfDay(now).getTime() - turn * cycle < 10000) {
  //     this.lotteryAwardService.processXsByType(TypeLottery.XSMB_45_S);
  //   // }
  // }

  // @Interval(180000)
  // async handleCronXsmb180s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSMB_180_S);
  // }
  // // mien bac --end

  // // mien trung --start
  // @Interval(45000)
  // async handleCronXsmt45s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSMT_45_S);
  // }

  // @Interval(180000)
  // async handleCronXsmt180s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSMT_180_S);
  // }
  // // mien trung --end

  // // mien nam --start
  // @Interval(45000)
  // async handleCronXsmn45s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSMN_45_S);
  // }

  // @Interval(180000)
  // async handleCronXsmn180s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSMN_180_S);
  // }
  // // mien trung --end

  // // supper rick lottery --start
  // @Interval(45000)
  // async handleCronXsspl45s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSSPL_45_S);
  // }

  // @Cron(CronExpression.EVERY_MINUTE)
  // async handleCronXsspl60s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSSPL_60_S);
  // }

  // @Interval(90000)
  // async handleCronXsspl90s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSSPL_90_S);
  // }

  // @Interval(120000)
  // async handleCronXsspl180s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSSPL_120_S);
  // }

  // @Interval(360000)
  // async handleCronXsspl360s() {
  //   await this.lotteryAwardService.processXsByType(TypeLottery.XSSPL_360_S);
  // }
  // // supper rick lottery --end

  // delete data
  // @Cron(CronExpression.EVERY_DAY_AT_5AM)
  @Cron(CronExpression.EVERY_4_HOURS)
  async handleCronDeleteData() {
    await this.lotteryAwardService.deleteDataResult();
  }
}
