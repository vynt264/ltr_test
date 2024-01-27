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
    ValidationPipe,
  } from "@nestjs/common";
  import { Cron } from "@nestjs/schedule";
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
  import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
  import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
  import { Roles } from "../auth/roles.guard/roles.decorator";
  import { BacklistGuard } from "../backlist/backlist.guard";
  import { TypeLottery } from "../lottery.award/enums/status.dto";
  import { UserRoles } from "../user/enums/user.enum";
  import { UpdateLotteryRequestDto } from "./dto/index";
  import { RequestDetailDto } from "./dto/request.detail.dto";
  import { LotteryRequest } from "./lottery.request.entity";
  import { LotteryRequestService } from "./lottery.request.service";
  import { startOfDay } from "date-fns";
  
  @Controller("/api/v1/LotteryRequest")
  @ApiTags("LotteryRequest")
  @ApiBearerAuth("Authorization")
  export class LotteryRequestController {
    constructor(private lotteryRequestService: LotteryRequestService) {}
  
    // @Post("create")
    // @ApiOperation({
    //   description: "Create LotteryRequest",
    // })
    // @ApiOkResponse({
    //   type: Response<LotteryRequest>,
    // })
    // async create(@Body() requestDetail: RequestDetailDto): Promise<any> {
    //   const now = new Date();
    //   const ok = await this.lotteryRequestService.create(requestDetail);
    //   // console.log(
    //   //   "####time processed successfully ",
    //   //   new Date().getTime() - now.getTime()
    //   // );
    //   return ok;
    // }
  
    @Get("all")
    @ApiResponse({
      status: 2000,
      description: "Get list LotteryRequest success",
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
      description: "Get all LotteryRequest",
    })
    @ApiOkResponse({
      type: Response<LotteryRequest[]>,
    })
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
    @Roles(UserRoles.SUPPER)
    async GetAll(
      @Query() paginationQueryDto: PaginationQueryDto,
      @Request() req: any
    ): Promise<any> {
      return this.lotteryRequestService.getAll(paginationQueryDto, req.user);
    }
  
    @Get(":id")
    @ApiOperation({
      description: "Get LotteryRequest by id",
    })
    @ApiOkResponse({
      type: Response<LotteryRequest>,
    })
    @Roles(UserRoles.SUPPER)
    async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
      return this.lotteryRequestService.getOneById(id);
    }
  
    @Patch(":id")
    @ApiOperation({
      description: "Update LotteryRequest",
    })
    @ApiOkResponse({
      type: Response<LotteryRequest>,
    })
    @UsePipes(ValidationPipe)
    @Roles(UserRoles.SUPPER)
    async update(
      @Param("id", ParseIntPipe) id: number,
      @Body() updateLotteryRequestDto: UpdateLotteryRequestDto
    ): Promise<any> {
      return this.lotteryRequestService.update(id, updateLotteryRequestDto);
    }
  
    @Delete(":id")
    @ApiOperation({
      description: "Delete LotteryRequest",
    })
    @Roles(UserRoles.SUPPER)
    async delete(@Param("id") id: number): Promise<any> {
      return this.lotteryRequestService.delete(id);
    }
  
    // @Cron("45 * * * * *")
    // async handleCron() {
    //   // await 2s
    //   const createRequestDto : RequestDetailDto ={
    //     baoLo: null,
    //     danhDe: null,
    //     type: TypeLottery.XSN_45s
    //   }
    //   this.lotteryRequestService.create(createRequestDto, true);
    // }
  
    // @Cron('*/15 * * * * *') // job 45s
    // async handleCronXsmb45s() {
    //   const now = new Date();
    //   const cycle = 45000;
    //   const minutesSinceMidnight = now.getTime() - startOfDay(now).getTime();
    //   const turn = Math.floor(minutesSinceMidnight / +cycle);
  
    //   if (now.getTime() - startOfDay(now).getTime() - turn * cycle < 10000) {
    //     const createRequestDto: RequestDetailDto = {
    //       baoLo: null,
    //       danhDe: null,
    //       type: TypeLottery.XSMB_45_S,
    //       turnIndex: null,
    //     };
    //     await new Promise((resolve) => setTimeout(resolve, 2000));
    //     await this.lotteryRequestService.create(createRequestDto, true);
    //   }
    // }
  }