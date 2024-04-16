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
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { JwtAuthGuard } from "./../auth/jwt/jwt-auth.guard";
import { CreateWalletDto, UpdateWalletDto } from "./dto/index";
import { Wallet } from "./wallet.entity";
import { WalletService } from "./wallet.service";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/Wallet")
@ApiTags("Wallet")
@ApiBearerAuth("Authorization")
@UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post("create")
  @ApiOperation({
    description: "Create Wallet",
  })
  @ApiOkResponse({
    type: Response<Wallet>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS)
  async create(
    @Body() createWalletDto: CreateWalletDto,
    @Request() req: any
  ): Promise<any> {
    return this.walletService.create(createWalletDto, req?.user);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list Wallet success",
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
    description: "Get all Wallet",
  })
  @ApiOkResponse({
    type: Response<Wallet[]>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async getAll(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.walletService.getAll(paginationQueryDto, req.user);
  }

  @Get("all-history")
  @ApiResponse({
    status: 2000,
    description: "Get list Wallet success",
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
    description: "Get all Wallet",
  })
  @ApiOkResponse({
    type: Response<Wallet[]>,
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async getAllHistory(
    @Query() paginationQueryDto: PaginationQueryDto,
    @Request() req: any
  ): Promise<any> {
    return this.walletService.getAllHistoty(paginationQueryDto, req.user);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get Wallet by id",
  })
  @ApiOkResponse({
    type: Response<Wallet>,
  })
  @Roles(UserRoles.SUPPER)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.walletService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update Wallet",
  })
  @ApiOkResponse({
    type: Response<Wallet>,
  })
  @UsePipes(ValidationPipe)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateWalletDto: UpdateWalletDto,
    @Request() req: any
  ): Promise<any> {
    return this.walletService.update(id, updateWalletDto, req?.user);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete Wallet",
  })
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.walletService.delete(id);
  }
}
