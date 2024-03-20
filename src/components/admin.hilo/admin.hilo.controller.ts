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
import { AdminHiloService } from "./admin.hilo.service";
import { PaginationQueryDto } from "../../common/common.dto/pagination.query.dto";
import { UserRoles } from "../user/enums/user.enum";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { UpdateSysConfigHiloDto } from "./dto/update.dto";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";
@Controller("/api/v1/adminHilo")
@ApiTags("AdminHilo")
export class AdminHiloController {
  constructor(private adminHiloService: AdminHiloService) {}

  @Get("all")
  @ApiOperation({
    description: "Get all hilo history",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async GetAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminHiloService.getHistory(paginationQuery);
  }

  @Get("getConfig")
  @ApiOperation({
    description: "Get config hilo",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async GetConfig(): Promise<any> {
    return this.adminHiloService.getConfig();
  }

  @Patch("updateConfig/:id")
  @ApiOperation({
    description: "Update config hilo",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async UpdateConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysConfigHiloDto,
    @Request() req: any
  ): Promise<any> {
    return this.adminHiloService.updateConfig(id, updateDto, req.user);
  }

  @Get("report")
  @ApiOperation({
    description: "Get report poker",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  // @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard, RolesGuard)
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async GetReport(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminHiloService.report(paginationQuery);
  }
}