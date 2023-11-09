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
import { PaginationQueryDto } from "../../common/common.dto";
import { Response } from "../../system/interfaces";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { JwtAuthGuard } from "./../auth/jwt/jwt-auth.guard";
import { API } from "./api.entity";
import { APIService } from "./api.third.service";
import { CreateAPIDto, UpdateAPIDto } from "./dto/index";

@Controller("/api/v1/api")
@ApiTags("API")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
export class APIController {
  constructor(private apiService: APIService) {}

  @Post("create")
  @ApiOperation({
    description: "Create api",
  })
  @ApiOkResponse({
    type: Response<API>,
  })
  @Roles(UserRoles.SUPPER)
  async create(@Body() apiDto: CreateAPIDto): Promise<any> {
    return this.apiService.create(apiDto);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list api success",
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
    description: "Get all api",
  })
  @ApiOkResponse({
    type: Response<API[]>,
  })
  @Roles(UserRoles.SUPPER)
  async GetAll(@Query() paginationQueryDto: PaginationQueryDto): Promise<any> {
    return this.apiService.getAll(paginationQueryDto);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get api by id",
  })
  @ApiOkResponse({
    type: Response<API>,
  })
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.apiService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update api",
  })
  @ApiOkResponse({
    type: Response<API>,
  })
  @UsePipes(ValidationPipe)
  @Roles(UserRoles.SUPPER)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() apiDto: UpdateAPIDto
  ): Promise<any> {
    return this.apiService.update(id, apiDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete api",
  })
  @Roles(UserRoles.SUPPER)
  async delete(@Param("id") id: number): Promise<any> {
    return this.apiService.delete(id);
  }
}
