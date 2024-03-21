import {
  Controller,
  Get,
  UseGuards,
  Query,
} from "@nestjs/common";
import { AdminDashboardService } from "./admin.dashboard.service";
import { PaginationQueryDto } from "src/common/common.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../auth/roles.guard/roles.decorator";
import { UserRoles } from "../../user/enums/user.enum";
import { AuthAdminGuard } from "../../auth/guards/auth-admin.guard";

@Controller("api/v1/admin-dashboard")
@ApiTags("Admin-dashboard")
@ApiBearerAuth("Authorization")
@UseGuards(AuthAdminGuard)
@Roles(UserRoles.SUPPER, UserRoles.ADMIN_BOOKMAKER)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) { }

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

  @Get("chart-order-all")
  @ApiOperation({
    description: "Get all Dashboard",
  })
  async GetChartOrderAll(@Query() paginationQuery: PaginationQueryDto): Promise<any> {
    return this.adminDashboardService.dataChartOrderAll(paginationQuery);
  }
}