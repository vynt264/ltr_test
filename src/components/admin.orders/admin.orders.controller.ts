import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
} from "@nestjs/common";
import { AdminOrdersService } from "./admin.orders.service";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { PaginationQueryDto } from "src/common/common.dto";
import { Cron, Interval, SchedulerRegistry } from '@nestjs/schedule';
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { UserRoles } from "../user/enums/user.enum";
import { ReportQueryDto } from "./dto/report.query.dto";

@Controller("api/v1/admin-orders")
@ApiTags("Admin-ordres")
@ApiBearerAuth("Authorization")
@UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
@Roles(UserRoles.SUPPER, UserRoles.USER_UPDATE)
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get("all")
  @ApiOperation({
    description: "Get all orders",
  })
  async GetAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminOrdersService.findAll(paginationQuery);
  }

  @Get("report")
  @ApiOperation({
    description: "Get report orders",
  })
  async GetReport(@Query() reportQueryDto: ReportQueryDto): Promise<any> {
    return this.adminOrdersService.reportAll(
      reportQueryDto?.bookmakerId,
      reportQueryDto?.timeFillter
    );
  }

  @Get("chart")
  @ApiOperation({
    description: "Get report chart",
  })
  async GetReportChart(@Query() reportQueryDto: ReportQueryDto): Promise<any> {
    return this.adminOrdersService.reportChart(reportQueryDto?.bookmakerId);
  }
}