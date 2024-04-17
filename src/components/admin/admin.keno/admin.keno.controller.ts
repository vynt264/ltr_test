import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
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
import { AdminKenoService } from "./admin.keno.service";
import { PaginationQueryDto } from "../../../common/common.dto/pagination.query.dto";
import { UserRoles } from "../../user/enums/user.enum";
import { UpdateSysConfigKenoDto } from "../admin.keno/dto/update.dto";
import { AuthAdminGuard } from "../../auth/guards/auth-admin.guard";
import { Logger } from "winston";
@Controller("/api/v1/adminKeno")
@ApiTags("AdminKeno")
export class AdminKenoController {
  constructor(
    private adminKenoService: AdminKenoService,
    @Inject("winston")
    private readonly logger: Logger
  ) {}

  @Get("all")
  @ApiOperation({
    description: "Get all hilo history",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async GetAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    try {
      return await this.adminKenoService.getHistory(paginationQuery);
    } catch (err) {
      this.logger.error(
        `${AdminKenoController.name} is Logging error: ${JSON.stringify(err)}`
      );
      throw new BadRequestException(err);
    }
  }

  @Get("getConfig")
  @ApiOperation({
    description: "Get config hilo",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async GetConfig(): Promise<any> {
    try {
      return await this.adminKenoService.getConfig();
    } catch (err) {
      this.logger.error(
        `${AdminKenoController.name} is Logging error: ${JSON.stringify(err)}`
      );
      throw new BadRequestException(err);
    }
  }

  @Patch("updateConfig/:id")
  @ApiOperation({
    description: "Update config hilo",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async UpdateConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateSysConfigKenoDto,
    @Request() req: any
  ): Promise<any> {
    try {
      return await this.adminKenoService.updateConfig(id, updateDto, req.user);
    } catch (err) {
      this.logger.error(
        `${AdminKenoController.name} is Logging error: ${JSON.stringify(err)}`
      );
      throw new BadRequestException(err);
    }
  }

  @Get("report")
  @ApiOperation({
    description: "Get report poker",
  })
  @ApiOkResponse({
    type: Response<any[]>,
  })
  @ApiBearerAuth("Authorization")
  @UseGuards(AuthAdminGuard)
  @Roles(UserRoles.SUPPER, UserRoles.ADMINISTRATORS, UserRoles.ADMIN_BOOKMAKER)
  async GetReport(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    try {
      return await this.adminKenoService.report(paginationQuery);
    } catch (err) {
      this.logger.error(
        `${AdminKenoController.name} is Logging error: ${JSON.stringify(err)}`
      );
      throw new BadRequestException(err);
    }
  }
}