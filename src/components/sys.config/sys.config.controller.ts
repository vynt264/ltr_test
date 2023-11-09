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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SuccessResponse } from "src/system/BaseResponse";
import { MESSAGE, STATUSCODE } from "src/system/constants";
import { PaginationQueryDto } from "../../common/common.dto";
import { Response } from "../../system/interfaces";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { CreateListSysConfigsDto } from "./dto/create.list.dto";
import { CreateSysConfigsDto, UpdateSysConfigsDto } from "./dto/index";
import { UpdateListSysConfigsDto } from "./dto/update.list.dto";
import { SysConfig } from "./sys.config.entity";
import { SysConfigsService } from "./sys.config.service";

@Controller("/api/v1/SysConfigs")
@ApiTags("SysConfigs")
@ApiBearerAuth("Authorization")
export class SysConfigsController {
  constructor(private sysConfigsService: SysConfigsService) {}

  @Patch("ids")
  @ApiOperation({
    description: "Update SysConfigs",
  })
  @ApiOkResponse({
    type: Response<SysConfig>,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.SYSTEM_CONFIG_UPDATE)
  async updateList(
    @Body() updateListSysConfigsDto: UpdateListSysConfigsDto,
    @Request() res: any
  ): Promise<any> {
    if (updateListSysConfigsDto?.sysConfigs?.length > 0) {
      for (const sysConfig of updateListSysConfigsDto.sysConfigs) {
        await this.sysConfigsService.update(sysConfig.id, sysConfig, res.user);
      }
    }
    return new SuccessResponse(
      STATUSCODE.COMMON_UPDATE_SUCCESS,
      updateListSysConfigsDto,
      MESSAGE.UPDATE_SUCCESS
    );
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list SysConfigs success",
  })
  @ApiQuery({
    name: "take",
    type: "number",
    description: "enter take (Take is limit in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "skip",
    type: "number",
    description: "enter skip (Skip is offset in sql) of record",
    required: true,
  })
  @ApiQuery({
    name: "order",
    type: "string",
    description:
      "The ORDER BY keyword sorts the records in ascending order by default. To sort the records in descending order, use the DESC|ASC keyword",
    required: true,
  })
  @ApiOperation({
    description: "Get all SysConfigs",
  })
  @ApiOkResponse({
    type: Response<SysConfig[]>,
  })
  async GetAll(@Query() paginationQueryDto: PaginationQueryDto): Promise<any> {
    return this.sysConfigsService.getAll(paginationQueryDto);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get SysConfigs by id",
  })
  @ApiOkResponse({
    type: Response<SysConfig>,
  })
  @UseGuards(JwtAuthGuard)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.sysConfigsService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update SysConfigs",
  })
  @ApiOkResponse({
    type: Response<SysConfig>,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.SYSTEM_CONFIG_UPDATE)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() SysConfigsDto: UpdateSysConfigsDto,
    @Request() res: any
  ): Promise<any> {
    return this.sysConfigsService.update(id, SysConfigsDto, res.user);
  }

  @Post("create")
  @ApiOperation({
    description: "Create SysConfigs",
  })
  @ApiOkResponse({
    type: Response<SysConfig>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.SYSTEM_CONFIG_UPDATE)
  async create(
    @Body() sysConfigsDto: CreateSysConfigsDto,
    @Request() res: any
  ): Promise<any> {
    return this.sysConfigsService.create(sysConfigsDto, res.user);
  }

  @Post("create-list")
  @ApiOperation({
    description: "Create SysConfigs",
  })
  @ApiOkResponse({
    type: Response<SysConfig>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.SYSTEM_CONFIG_UPDATE)
  async createList(
    @Body() createSysConfigListDto: CreateListSysConfigsDto,
    @Request() res: any
  ): Promise<any> {
    if (createSysConfigListDto?.sysConfigs?.length > 0) {
      for (const sysConfig of createSysConfigListDto.sysConfigs) {
        await this.sysConfigsService.create(sysConfig, res.user);
      }
    }
    return new SuccessResponse(
      STATUSCODE.COMMON_CREATE_SUCCESS,
      createSysConfigListDto,
      MESSAGE.CREATE_SUCCESS
    );
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete SysConfigs",
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.SYSTEM_CONFIG_UPDATE)
  async delete(@Param("id") id: number, @Request() res: any): Promise<any> {
    return this.sysConfigsService.delete(id, res.user);
  }
}
