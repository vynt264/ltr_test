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
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { Lottery } from "./lottery.entity";
import { LotteryService } from "./lottery.service";
import { CreateLotteryDto, UpdateLotteryDto } from "./dto/index";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";

@Controller("/api/v1/Lottery")
@ApiTags("Lottery")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard, RateLimitGuard)
export class LotteryController {
  constructor(private lotteryService: LotteryService) {}

  @Post("create")
  @ApiOperation({
    description: "Create Lottery",
  })
  @ApiOkResponse({
    type: Response<Lottery>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.OPTION1)
  async create(@Body() createLotteryDto: CreateLotteryDto): Promise<any> {
    return this.lotteryService.create(createLotteryDto);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list Lottery success",
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
    description: "Get all Lottery",
  })
  @ApiOkResponse({
    type: Response<Lottery[]>,
  })
  @Roles(UserRoles.SUPPER)
  async GetAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.lotteryService.getAll(paginationQueryDto, req.user);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get Lottery by id",
  })
  @ApiOkResponse({
    type: Response<Lottery>,
  })
  @Roles(UserRoles.SUPPER)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.lotteryService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update Lottery",
  })
  @ApiOkResponse({
    type: Response<Lottery>,
  })
  @UsePipes(ValidationPipe)
  @Roles(UserRoles.SUPPER)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateLotteryDto: UpdateLotteryDto
  ): Promise<any> {
    return this.lotteryService.update(id, updateLotteryDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete Lottery",
  })
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.lotteryService.delete(id);
  }

  // job 45s

  // job xsmb 

}
