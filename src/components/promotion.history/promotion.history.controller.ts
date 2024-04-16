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
import { PromotionHistoriesService } from "./promotion.history.service";
import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
import {
  CreatePromotionHistoriesDto,
  UpdatePromotionHistoriesDto
} from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { PromotionHistories } from "./promotion.history.entity";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/promotionHis")
@ApiTags("PromotionHis")
export class PromotionHistoriesController {
  constructor(private promotionHistoriesService: PromotionHistoriesService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all promotion histories",
  })
  @ApiOkResponse({
    type: Response<PromotionHistories[]>,
  })
  async GetAll(): Promise<any> {
    return this.promotionHistoriesService.getAll();
  }

  @Get("searchByUser")
  @ApiOperation({
    description: "Get all promotion histories",
  })
  @ApiOkResponse({
    type: Response<PromotionHistories[]>,
  })
  @ApiBearerAuth("Authorization")
  async SearchByUser(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.promotionHistoriesService.searchByUser(paginationQuery);
  }

  @Get(":userId")
  @ApiOperation({
    description: "Get all promotion histories by userId",
  })
  @ApiOkResponse({
    type: Response<PromotionHistories[]>,
  })
  @ApiBearerAuth("Authorization")
  async GetInforByUser(@Param("userId", ParseIntPipe) userId: number,): Promise<any> {
    return this.promotionHistoriesService.getInfoByUserId(userId);
  }


  @Post("create")
  @ApiOperation({
    description: "Create promotion histories",
  })
  @ApiOkResponse({
    type: Response<PromotionHistories>,
  })
  @ApiBearerAuth("Authorization")
  async create(@Body() createDto: CreatePromotionHistoriesDto): Promise<any> {
    return this.promotionHistoriesService.create(createDto);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update promotion histories",
  })
  @ApiOkResponse({
    type: Response<PromotionHistories>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async updatePromotion(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdatePromotionHistoriesDto
  ): Promise<any> {
    return this.promotionHistoriesService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete promotion histories",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.promotionHistoriesService.delete(id);
  }
}