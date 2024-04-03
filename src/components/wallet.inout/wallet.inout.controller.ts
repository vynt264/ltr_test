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
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { WalletInoutService } from "./wallet.inout.service";
import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
import {
  CreateWalletInoutDto,
  UpdateWalletInoutDto
} from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { WalletInout } from "./wallet.inout.entity";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { AuthGuard } from "../auth/guards/auth.guard";
@Controller("/api/v1/walletInout")
@ApiTags("WalletInout")
export class WalletInoutController {
  constructor(private walletInoutService: WalletInoutService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all WalletInout",
  })
  @ApiOkResponse({
    type: Response<WalletInout[]>,
  })
  async GetAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.walletInoutService.getAll(paginationQuery);
  }

  @Get("history")
  @ApiOperation({
    description: "Get wallet history",
  })
  @ApiOkResponse({
    type: Response<WalletInout[]>,
  })
  async GetWalletHistory(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.walletInoutService.getWalletHistory(paginationQuery);
  }

  @Post("create")
  @ApiOperation({
    description: "Create WalletInout",
  })
  @ApiOkResponse({
    type: Response<WalletInout>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async create(@Body() userDto: CreateWalletInoutDto, @Request() req: any): Promise<any> {
    return this.walletInoutService.create(userDto, req.user);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update WalletInout",
  })
  @ApiOkResponse({
    type: Response<WalletInout>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async updateWalletInout(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateWalletInoutDto,
    @Request() req: any
  ): Promise<any> {
    return this.walletInoutService.update(id, updateDto, req.user);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete WalletInout",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.walletInoutService.delete(id);
  }
}