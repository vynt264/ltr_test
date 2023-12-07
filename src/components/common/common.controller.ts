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
  import { CommonService } from "./common.service";
  import { PaginationQueryDto } from "../../common/common.dto/pagination.query.dto";
  import {
    CreateCommonDto,
    UpdateCommonDto
  } from "./dto/index";
  import { UserRoles } from "../user/enums/user.enum";
  import { Common } from "./common.entity";
  import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
  @Controller("/api/v1/common")
  @ApiTags("Common")
  export class CommonController {
    constructor(private commonService: CommonService) { }
  
    @Get("all")
    @ApiOperation({
      description: "Get all Common",
    })
    @ApiOkResponse({
      type: Response<Common[]>,
    })
    async GetAll(): Promise<any> {
      return this.commonService.getAll();
    }

    @Get("key/:key")
    @ApiOperation({
      description: "Get common by common_key",
    })
    @ApiOkResponse({
      type: Response<Common>,
    })
    @ApiBearerAuth("Authorization")
    async GetByCommonKey(
      @Param("key") key: string,
    ): Promise<any> {
      return this.commonService.getByCommonKey(key);
    }
  
    @Post("create")
    @ApiOperation({
      description: "Create Common",
    })
    @ApiOkResponse({
      type: Response<Common>,
    })
    @ApiBearerAuth("Authorization")
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
    async create(@Body() userDto: CreateCommonDto): Promise<any> {
      return this.commonService.create(userDto);
    }
  
    @Patch(":id")
    @ApiOperation({
      description: "Update Common",
    })
    @ApiOkResponse({
      type: Response<Common>,
    })
    @UsePipes(ValidationPipe)
    @ApiBearerAuth("Authorization")
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
    async updateCommon(
      @Param("id", ParseIntPipe) id: number,
      @Body() updateDto: UpdateCommonDto,
      @Request() req: any
    ): Promise<any> {
      return this.commonService.update(id, updateDto, req.user);
    }
  
    @Delete(":id")
    @ApiOperation({
      description: "Delete Common",
    })
    @ApiBearerAuth("Authorization")
    @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
    @Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
    async delete(@Param("id") id: number): Promise<any> {
      return this.commonService.delete(id);
    }
  }