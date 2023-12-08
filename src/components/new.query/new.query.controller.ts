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
import { NewQueryService } from "./new.query.sevice";
import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
import { UserRoles } from "../user/enums/user.enum";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
@Controller("/api/v1/newQuery")
@ApiTags("NewQuery")
@ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
export class NewQueryController {
  constructor(private newQueryService: NewQueryService) { }

  @Get("userWin")
  @ApiOperation({
    description: "Get list user win",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  // @Roles(UserRoles.SUPPER)
  async UserWin(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.newQueryService.getListUserWin(paginationQuery);
  }

  @Get("userPlaying")
  @ApiOperation({
    description: "Get list user playing",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  // @Roles(UserRoles.SUPPER)
  async UserPlaying(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<any> {
    return this.newQueryService.getListUserPlaying(paginationQuery);
  }

  @Get("favoriteGame")
  @ApiOperation({
    description: "Get list favorite game",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  // @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  // @Roles(UserRoles.SUPPER)
  async FavoriteGame(
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<any> {
    return this.newQueryService.getListFavoriteGame(paginationQuery);
  }
}
