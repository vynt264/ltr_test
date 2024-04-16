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
import { NewQueryService } from "./new.query.sevice";
import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
import { UserRoles } from "../user/enums/user.enum";
import { DataFake } from "./data.fake.entity";
import { CreateDataFakeRequestDto } from "./dto/create.data.fake.dto";
import { UpdateDataFakeRequestDto } from "./dto";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AuthGuard } from "../auth/guards/auth.guard";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";

@Controller("/api/v1/newQuery")
@ApiTags("NewQuery")
@ApiBearerAuth("Authorization")
export class NewQueryController {
  constructor(private newQueryService: NewQueryService) { }

  @Get("userWin")
  @ApiOperation({
    description: "Get list user win",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
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
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
  async getDataFake(
    @Param("key") key: string,
    @Query() paginationQuery: PaginationQueryDto
  ): Promise<any> {
    return this.newQueryService.getDataFake(key, paginationQuery);
  }

  @Post("dataFake/create")
  @ApiOperation({
    description: "Create data fake",
  })
  @ApiOkResponse({
    type: Response<DataFake>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
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
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
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
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER, UserRoles.ADMINISTRATORS, UserRoles.ADMINISTRATORS_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.newQueryService.deleteDataFake(id);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async createDataAuto() {
    await this.newQueryService.createDataFakeAuto();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deteleDataAuto() {
    await this.newQueryService.deteleDataFakeAuto();
  }
}
