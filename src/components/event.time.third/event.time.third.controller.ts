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
import { RateLimitGuard } from "../auth/rate.guard/rate.limit.guard";
import { Roles } from "../auth/roles.guard/roles.decorator";
import { RolesGuard } from "../auth/roles.guard/roles.guard";
import { BacklistGuard } from "../backlist/backlist.guard";
import { UserRoles } from "../user/enums/user.enum";
import { JwtAuthGuard } from "./../auth/jwt/jwt-auth.guard";
import { CreateEventTimeDto, UpdateEventTimeDto } from "./dto/index";
import { UpdateEventTimeIsLockDto } from "./dto/updateIsLock.dto";
import { EventTime } from "./event.time.third.entity";
import { EventTimeService } from "./event.time.third.service";

@Controller("/api/v1/event-time")
@ApiTags("Event-Time")
@ApiBearerAuth("Authorization")
@UseGuards(RateLimitGuard)
export class EventTimeController {
  constructor(private eventTimeService: EventTimeService) {}

  @Post("create")
  @ApiOperation({
    description: "Create event-time",
  })
  @ApiOkResponse({
    type: Response<EventTime>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.EVENT_TIME_UPDATE)
  async create(@Body() eventTimeDto: CreateEventTimeDto): Promise<any> {
    return this.eventTimeService.create(eventTimeDto);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list event-time success",
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
    description: "Get all event-time",
  })
  @ApiOkResponse({
    type: Response<EventTime[]>,
  })
  async GetAll(@Query() paginationQueryDto: PaginationQueryDto): Promise<any> {
    return this.eventTimeService.getAll(paginationQueryDto);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get event-time by id",
  })
  @ApiOkResponse({
    type: Response<EventTime>,
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER)
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.eventTimeService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update event-time",
  })
  @ApiOkResponse({
    type: Response<EventTime>,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.EVENT_TIME_UPDATE)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() eventTimeDto: UpdateEventTimeDto
  ): Promise<any> {
    return this.eventTimeService.update(id, eventTimeDto);
  }

  @Patch(":id/isLock")
  @ApiOperation({
    description: "Update event-time isLock",
  })
  @ApiOkResponse({
    type: Response<EventTime>,
  })
  @UsePipes(ValidationPipe)
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.EVENT_TIME_UPDATE)
  async updateIsLock(
    @Param("id", ParseIntPipe) id: number,
    @Body() eventTimeDto: UpdateEventTimeIsLockDto
  ): Promise<any> {
    return this.eventTimeService.updateIsLock(id, eventTimeDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete event-time",
  })
  @UseGuards(JwtAuthGuard, BacklistGuard, RolesGuard)
  @Roles(UserRoles.SUPPER, UserRoles.EVENT_TIME_UPDATE)
  async delete(@Param("id") id: number): Promise<any> {
    return this.eventTimeService.delete(id);
  }
}
