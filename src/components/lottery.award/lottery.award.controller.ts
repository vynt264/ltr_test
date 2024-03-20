import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
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
// import { GetLotteryAwardDto } from "./dto/get.data";
import { CreateLotteryAwardDto } from "./dto/index";
import { LotteryAward } from "./lottery.award.entity";
import { LotteryAwardService } from "./lottery.award.service";
import { CurrentAwardXsmb, TypeLottery } from "./enums/status.dto";
import { startOfDay } from "date-fns";
// import { RequestDetailDto } from "../lottery.request/dto/request.detail.dto";
// import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { AuthGuard } from "../auth/guards/auth.guard";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";

@Controller("/api/v1/lotteryAward")
@ApiTags("lotteryAward")
export class LotteryAwardController {
  constructor(private lotteryAwardService: LotteryAwardService) { }

  @Post('')
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async createLotteryAward(@Body() createLotteryAwardDto: CreateLotteryAwardDto): Promise<any> {
    return this.lotteryAwardService.createLotteryAward(createLotteryAwardDto);
  }

  // @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  @UseGuards(AuthAdminGuard)
  @Get("admin-all")
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
  async getAdminAll(
    @Query() paginationQueryDto: PaginationQueryDto,
  ): Promise<any> {
    return this.lotteryAwardService.adminGetAll(paginationQueryDto);
  }

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

  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
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
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
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
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.lotteryAwardService.getOneById(id);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete lotteryAward",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.lotteryAwardService.delete(id);
  }

  // delete data
  // @Cron(CronExpression.EVERY_DAY_AT_5AM)
  // @Cron(CronExpression.EVERY_4_HOURS)
  // async handleCronDeleteData() {
  //   await this.lotteryAwardService.deleteDataResult();
  // }
}
