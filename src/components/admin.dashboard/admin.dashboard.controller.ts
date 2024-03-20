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
import { AdminDashboardService } from "./admin.dashboard.service";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { PaginationQueryDto } from "src/common/common.dto";
import { Cron, Interval, SchedulerRegistry } from '@nestjs/schedule';
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { UserRoles } from "../user/enums/user.enum";
import { ReportQueryDto } from "./dto/report.query.dto";
import { AuthAdminGuard } from "../auth/guards/auth-admin.guard";

@Controller("api/v1/admin-dashboard")
@ApiTags("Admin-dashboard")
@ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
@UseGuards(AuthAdminGuard)
@Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}
  
  @Get("chart-user")
  @ApiOperation({
    description: "Get all Dashboard",
  })
  async GetChartUser(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminDashboardService.dataChartUser(paginationQuery);
  }

  @Get("chart-order")
  @ApiOperation({
    description: "Get all Dashboard",
  })
  async GetChartOrder(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminDashboardService.dataChartOrder(paginationQuery);
  }
}