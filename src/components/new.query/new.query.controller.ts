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
import { DataFake } from "./data.fake.entity";
import { CreateDataFakeRequestDto } from "./dto/create.data.fake.dto";
import { UpdateDataFakeRequestDto } from "./dto";
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

  @Get("dataFake/:key")
  @ApiOperation({
    description: "Get data fake by key",
  })
  @ApiOkResponse({
    type: Response<DataFake[]>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER)
  async getDataFake(@Param("key") key: string): Promise<any> {
    return this.newQueryService.getDataFake(key);
  }

  @Post("dataFake/create")
  @ApiOperation({
    description: "Create data fake",
  })
  @ApiOkResponse({
    type: Response<DataFake>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER)
  async create(@Body() createDto: CreateDataFakeRequestDto): Promise<any> {
    return this.newQueryService.createDataFake(createDto);
  }

  @Patch("dataFake/:id")
  @ApiOperation({
    description: "Update data fake",
  })
  @ApiOkResponse({
    type: Response<DataFake>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER)
  async updateGame(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateDataFakeRequestDto
  ): Promise<any> {
    return this.newQueryService.updateDataFake(id, updateDto);
  }

  @Delete("dataFake/:id")
  @ApiOperation({
    description: "Delete data fake",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.newQueryService.deleteDataFake(id);
  }
}
