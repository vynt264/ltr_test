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
  Res,
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
import { UserRoles } from "../../components/user/enums/user.enum";
import { Response } from "../../system/interfaces";
import { PaginationQueryDto } from "../../common/common.dto";
import { BacklistGuard } from "../backlist/backlist.guard";
import { JwtAuthGuard } from "./../auth/jwt/jwt-auth.guard";
import { Roles } from "./../auth/roles.guard/roles.decorator";
import { RolesGuard } from "./../auth/roles.guard/roles.guard";
import { CreateUserHistoryDto, UpdateUserHistoryDto } from "./dto/index";
import { UserHistory } from "./user.history.entity";
import { UserHistoryService } from "./user.history.service";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { Response as Resp } from "express";
import { Cron } from "@nestjs/schedule";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/user-history")
@ApiTags("User-History")
@ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
@UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
export class UserHistoryController {
  constructor(private userHisService: UserHistoryService) {}

  @Get("export")
  @ApiResponse({
    status: 2000,
    description: " export list land histoty success",
  })
  @ApiOperation({
    description: " export  search (username, startDate, endDate)",
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async export(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Res() res: Resp
  ): Promise<any> {
    this.userHisService.export(res, paginationQueryDto);
  }

  @Post("create")
  @ApiOperation({
    description: "Create User-History",
  })
  @ApiOkResponse({
    type: Response<UserHistory>,
  })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async create(@Body() userHistoryDto: CreateUserHistoryDto): Promise<any> {
    return this.userHisService.create(userHistoryDto);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list User-History success",
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
    description: "Get all User-History",
  })
  @ApiOkResponse({
    type: Response<UserHistory[]>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async GetAll(@Query() paginationQueryDto: PaginationQueryDto): Promise<any> {
    return this.userHisService.getAll(paginationQueryDto);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get User-History by id",
  })
  @ApiOkResponse({
    type: Response<UserHistory>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.userHisService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update User-History",
  })
  @ApiOkResponse({
    type: Response<UserHistory>,
  })
  @UsePipes(ValidationPipe)
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() userHistoryDto: UpdateUserHistoryDto
  ): Promise<any> {
    return this.userHisService.update(id, userHistoryDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete User-History",
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async delete(@Param("id") id: number): Promise<any> {
    return this.userHisService.delete(id);
  }

  @Cron("0 40 * * * *")
  async handleCronDeleteData() {
    await this.userHisService.deleteDataAuto();
  }
}
