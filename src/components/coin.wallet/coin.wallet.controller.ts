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
    ApiTags,
  } from "@nestjs/swagger";
  import { Response } from "../../system/interfaces";
  import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
  import { Roles } from "../auth/roles.guard/roles.decorator";
  import { RolesGuard } from "../auth/roles.guard/roles.guard";
  import { BacklistGuard } from "../backlist/backlist.guard";
  import { CoinWalletService } from "./coin.wallet.service";
  import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
  import {
    CreateCoinWalletDto,
    UpdateCoinWalletDto
  } from "./dto/index";
  import { UserRoles } from "../user/enums/user.enum";
  import { CoinWallet } from "./coin.wallet.entity";
  import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { AuthGuard } from "../auth/guards/auth.guard";
  @Controller("/api/v1/coinWallet")
  @ApiTags("CoinWallet")
  export class CoinWalletController {
    constructor(private coinWalletService: CoinWalletService) { }
  
    @Get("all")
    @ApiOperation({
      description: "Get all CoinWallet",
    })
    @ApiOkResponse({
      type: Response<CoinWallet[]>,
    })
    async GetAll(): Promise<any> {
      return this.coinWalletService.getAll();
    }

    @Get(":userId")
    @ApiOperation({
      description: "Get CoinWallet by userid",
    })
    @ApiOkResponse({
      type: Response<CoinWallet>,
    })
    @ApiBearerAuth("Authorization")
    // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
    @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
    async getByUserId(@Param("userId", ParseIntPipe) userId: number,): Promise<any> {
      return this.coinWalletService.getByUserId(userId);
    }
  
    @Post("create")
    @ApiOperation({
      description: "Create CoinWallet",
    })
    @ApiOkResponse({
      type: Response<CoinWallet>,
    })
    @ApiBearerAuth("Authorization")
    // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
    @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
    // @Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
    async create(@Body() userDto: CreateCoinWalletDto): Promise<any> {
      return this.coinWalletService.create(userDto);
    }
  
    @Patch(":id")
    @ApiOperation({
      description: "Update CoinWallet",
    })
    @ApiOkResponse({
      type: Response<CoinWallet>,
    })
    @UsePipes(ValidationPipe)
    @ApiBearerAuth("Authorization")
    // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
    @Roles(UserRoles.SUPPER)
    async updateCoinWallet(
      @Param("id", ParseIntPipe) id: number,
      @Body() updateDto: UpdateCoinWalletDto
    ): Promise<any> {
      return this.coinWalletService.update(id, updateDto);
    }
  
    @Delete(":id")
    @ApiOperation({
      description: "Delete CoinWallet",
    })
    @ApiBearerAuth("Authorization")
    // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard)
    @Roles(UserRoles.SUPPER)
    async delete(@Param("id") id: number): Promise<any> {
      return this.coinWalletService.delete(id);
    }
  }