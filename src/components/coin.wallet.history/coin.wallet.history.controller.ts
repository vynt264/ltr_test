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
import { Roles } from "../auth/roles.guard/roles.decorator";
import { BacklistGuard } from "../backlist/backlist.guard";
import { CoinWalletHistoryService } from "./coin.wallet.history.service";
import {
  CreateCoinWalletHistoryDto,
  UpdateCoinWalletHistoryDto
} from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { CoinWalletHistories } from "./coin.wallet.history.entiry";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/coinWalletHistory")
@ApiTags("CoinWalletHistory")
export class CoinWalletHistoryController {
  constructor(private coinWalletHistoryService: CoinWalletHistoryService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all CoinWalletHistory",
  })
  @ApiOkResponse({
    type: Response<CoinWalletHistories[]>,
  })
  async GetAll(): Promise<any> {
    return this.coinWalletHistoryService.getAll();
  }

  @Get(":userId")
  @ApiOperation({
    description: "Get CoinWalletHistory by userid",
  })
  @ApiOkResponse({
    type: Response<CoinWalletHistories>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  async getByUserId(@Param("userId", ParseIntPipe) userId: number,): Promise<any> {
    return this.coinWalletHistoryService.getByUserId(userId);
  }

  @Post("create")
  @ApiOperation({
    description: "Create CoinWalletHistory",
  })
  @ApiOkResponse({
    type: Response<CoinWalletHistories>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  async create(@Body() userDto: CreateCoinWalletHistoryDto): Promise<any> {
    return this.coinWalletHistoryService.create(userDto);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update CoinWalletHistory",
  })
  @ApiOkResponse({
    type: Response<CoinWalletHistories>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER)
  async updateCoinWalletHistory(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateCoinWalletHistoryDto
  ): Promise<any> {
    return this.coinWalletHistoryService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete CoinWalletHistory",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.coinWalletHistoryService.delete(id);
  }
}