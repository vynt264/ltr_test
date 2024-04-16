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
import { PromotionService } from "./promotion.service";
import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
import {
  CreatePromotionDto,
  UpdatePromotionDto
} from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { Promotion } from "./promotion.entity";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/promotion")
@ApiTags("Promotion")
export class PromotionController {
  constructor(private promotionService: PromotionService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all Promotion",
  })
  @ApiOkResponse({
    type: Response<Promotion[]>,
  })
  async GetAll(): Promise<any> {
    return this.promotionService.getAll();
  }

  @Post("create")
  @ApiOperation({
    description: "Create Promotion",
  })
  @ApiOkResponse({
    type: Response<Promotion>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async create(@Body() userDto: CreatePromotionDto): Promise<any> {
    return this.promotionService.create(userDto);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update Promotion",
  })
  @ApiOkResponse({
    type: Response<Promotion>,
  })
  @UsePipes(ValidationPipe)
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async updatePromotion(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdatePromotionDto
  ): Promise<any> {
    return this.promotionService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete Promotion",
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthGuard, BacklistGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.promotionService.delete(id);
  }
}