import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "../../../system/interfaces";
import { Roles } from "../../auth/roles.guard/roles.decorator";
import { AdminPokerService } from "./admin.poker.service";
import { PaginationQueryDto } from "./../../../common/common.dto/pagination.query.dto";
import UpdateSysConfigPokerDto from "./dto/update.dto";
import { AuthAdminGuard } from "../../auth/guards/auth-admin.guard";
import { RolesGuard } from "../guards/roles.guard";
import { RIGHTS } from "src/system/constants/rights";

@Controller("/api/v1/adminPoker")
@ApiTags("AdminPoker")
@UseGuards(AuthAdminGuard, RolesGuard)
export class AdminPokerController {
  constructor(private adminPokerService: AdminPokerService) {}

  @Get("all")
  @ApiOperation({
    description: "Get all poker history",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  async GetAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminPokerService.getHistory(paginationQuery);
  }

  @Get("getConfig")
  @ApiOperation({
    description: "Get config poker",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  @Roles(RIGHTS.ShowSettingOriginals)
  async GetConfig(): Promise<any> {
    return this.adminPokerService.getConfig();
  }

  @Patch("updateConfig/:id")
  @ApiOperation({
    description: "Update config poker",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  @Roles(RIGHTS.EditSettingOriginals)
  async UpdateConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysConfigPokerDto,
    @Request() req: any
  ): Promise<any> {
    return this.adminPokerService.updateConfig(id, updateDto, req.user);
  }

  @Get("report")
  @ApiOperation({
    description: "Get report poker",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  async GetReport(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminPokerService.report(paginationQuery);
  }
}