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
import { UserInfoService } from "./user.info.service";
import { PaginationQueryDto } from "./../../common/common.dto/pagination.query.dto";
import {
  CreateUserInfoDto,
  UpdateUserInfoDto,
} from "./dto/index";
import { UserRoles } from "../user/enums/user.enum";
import { UserInfo } from "./user.info.entity";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
@Controller("/api/v1/userInfo")
@ApiTags("userInfo")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
export class UserInfoController {
  constructor(private userInfoService: UserInfoService) { }

  @Get("all")
  @ApiOperation({
    description: "Get all user info",
  })
  @ApiOkResponse({
    type: Response<UserInfo[]>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER)
  async GetAll(): Promise<any> {
    return this.userInfoService.getAll();
  }

  @Post("create")
  @ApiOperation({
    description: "Create user info",
  })
  @ApiOkResponse({
    type: Response<UserInfo>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
  async create(@Body() userDto: CreateUserInfoDto): Promise<any> {
    return this.userInfoService.create(userDto);
  }

  @Get(":userId")
  @ApiOperation({
    description: "Get user info by userId",
  })
  @ApiOkResponse({
    type: Response<UserInfo>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard)
  async GetOne(@Param("userId", ParseIntPipe) userId: number): Promise<any> {
    return this.userInfoService.getByUserId(userId);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update user info",
  })
  @ApiOkResponse({
    type: Response<UserInfo>,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(RolesGuard)
  @Roles(UserRoles.SUPPER)
  async updateUserInfo(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserInfoDto
  ): Promise<any> {
    return this.userInfoService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete user info",
  })
  @UseGuards(RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
  async delete(@Param("id") id: number): Promise<any> {
    return this.userInfoService.delete(id);
  }
}