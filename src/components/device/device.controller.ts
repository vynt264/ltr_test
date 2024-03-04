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
import { BacklistGuard } from "../backlist/backlist.guard";
import { JwtAuthGuard } from "./../auth/jwt/jwt-auth.guard";
import { Device } from "./device.entity";
import { DeviceService } from "./device.service";
import { CreateDeviceDto, UpdateDeviceDto } from "./dto/index";
import { AuthGuard } from "../auth/guards/auth.guard";

@Controller("/api/v1/device")
@ApiTags("Device")
@ApiBearerAuth("Authorization")
// @UseGuards(JwtAuthGuard, BacklistGuard)
@UseGuards(AuthGuard, BacklistGuard)
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @Post("create")
  @ApiOperation({
    description: "Create device",
  })
  @ApiOkResponse({
    type: Response<Device>,
  })
  async create(@Body() deviceDto: CreateDeviceDto): Promise<any> {
    return this.deviceService.create(deviceDto);
  }

  @Get("all")
  @ApiResponse({
    status: 2000,
    description: "Get list device success",
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
    description: "Get all device",
  })
  @ApiOkResponse({
    type: Response<Device[]>,
  })
  async GetAll(@Query() paginationQueryDto: PaginationQueryDto): Promise<any> {
    return this.deviceService.getAll(paginationQueryDto);
  }

  @Get(":id")
  @ApiOperation({
    description: "Get device by id",
  })
  @ApiOkResponse({
    type: Response<Device>,
  })
  async GetOne(@Param("id", ParseIntPipe) id: number): Promise<any> {
    return this.deviceService.getOneById(id);
  }

  @Patch(":id")
  @ApiOperation({
    description: "Update device",
  })
  @ApiOkResponse({
    type: Response<Device>,
  })
  @UsePipes(ValidationPipe)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() deviceDto: UpdateDeviceDto
  ): Promise<any> {
    return this.deviceService.update(id, deviceDto);
  }

  @Delete(":id")
  @ApiOperation({
    description: "Delete device",
  })
  async delete(@Param("id") id: number): Promise<any> {
    return this.deviceService.delete(id);
  }
}
