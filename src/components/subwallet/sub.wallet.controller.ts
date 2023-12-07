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
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { CreateSubWalletDto, UpdateSubWalletDto } from "./dto/index";
import { SubWallet } from "./sub.wallet.entity";
import { SubWalletService } from "./sub.wallet.service";

@Controller("/api/v1/SubWallet")
@ApiTags("SubWallet")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
export class SubWalletController {
  constructor(private subWalletService: SubWalletService) {}

  @Post("create")
  @ApiOperation({
    description: "Create SubWallet",
  })
  @ApiOkResponse({
    type: Response<SubWallet>,
  })
  @Roles(UserRoles.SUPPER)
  async create(
    @Body() createSubWalletDto: CreateSubWalletDto,
    @Request() req: any
  ): Promise<any> {
    return this.subWalletService.create(createSubWalletDto, req?.user);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list SubWallet success",
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
    description: "Get all SubWallet",
  })
  @ApiOkResponse({
    type: Response<SubWallet[]>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.SUB_WALLET_VIEW)
  async GetAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.subWalletService.getAll(paginationQueryDto, req.user);
  }

  @Get("all-history")
  @ApiResponse({
    status: 2000,
    description: "Get list SubWallet success",
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
    description: "Get all SubWallet",
  })
  @ApiOkResponse({
    type: Response<SubWallet[]>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.SUB_WALLET_VIEW)
  async getAllHistoty(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.subWalletService.getAllHistoty(paginationQueryDto, req.user);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get SubWallet by id",
  })
  @ApiOkResponse({
    type: Response<SubWallet>,
  })
  @Roles(UserRoles.SUPPER)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.subWalletService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update SubWallet",
  })
  @ApiOkResponse({
    type: Response<SubWallet>,
  })
  @UsePipes(ValidationPipe)
  @Roles(UserRoles.SUPPER, UserRoles.SUB_WALLET_UPDATE)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSubWalletDto: UpdateSubWalletDto,
    @Request() req: any
  ): Promise<any> {
    return this.subWalletService.update(id, updateSubWalletDto, req?.user);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete SubWallet",
  })
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.subWalletService.delete(id);
  }
}
