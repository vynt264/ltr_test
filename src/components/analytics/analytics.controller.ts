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
  UsePipes,
  UseGuards,
  ValidationPipe,
  Request,
} from "@nestjs/common";
import { Cron, CronExpression, Interval } from "@nestjs/schedule";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { UserRoles } from "../user/enums/user.enum";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { BodyAnalyticsDto } from "./dto/bodyAnalytics.dto";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/analytics")
@ApiTags("analytics")
@ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, BacklistGuard, RateLimitGuard)
@UseGuards(AuthGuard, BacklistGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Post("latest-50rounds")
  // @Roles(UserRoles.MEMBER)
  async getAnalyticsByType(
    @Body() bodyDto: BodyAnalyticsDto,
    @Request() req: any
  ): Promise<any> {
    return this.analyticsService.getAnalytics(bodyDto, req.user);
  }

}
